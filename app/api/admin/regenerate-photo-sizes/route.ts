import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import { currentFinishSignature } from '@/app/lib/photoFinish'
import { r2OriginalsStore } from '@/app/lib/privateOriginals'
import { streamToBuffer } from '@/app/lib/r2Stream'
import { REUSE_ORIGINAL_KEY } from '@/collections/photoOriginals'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Maintenance route for TYN-344 (site-wide blurry photos): the hero/card
// imageSizes in collections/Photos.ts were bumped to higher resolutions with
// an explicit JPEG quality, but that only affects NEW uploads. This
// regenerates ONE existing photo's preview sizes from its original file,
// re-running the same sharp resize + treatment/sharpening/watermark pipeline the
// real ingest runs, so it ends up equivalent to a fresh upload. One photo
// per request (not a bulk loop) so it stays well inside Vercel's function
// time limit regardless of library size - call it once per photo ID from an
// authenticated admin session.
//
// With onlyIfStale the photo is left alone when it is already marked as finished with the
// current site design (Photo.finishSignature, see collections/photoSizePipeline.ts). That
// is what lets "Apply to all photos" resume an interrupted run and do nothing when
// nothing has changed. Without the flag it always rebuilds.

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = await payload.auth({ headers: headersList })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let id: number | string
    let onlyIfStale = false
    try {
      const body = await request.json()
      id = body?.id
      onlyIfStale = body?.onlyIfStale === true
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const photo = (await payload.findByID({ collection: 'photos', id, depth: 0 })) as Photo
    if (!photo?.url) {
      return NextResponse.json({ error: 'Photo not found or has no url' }, { status: 404 })
    }

    if (onlyIfStale && photo.finishSignature && photo.finishSignature === (await currentFinishSignature())) {
      return NextResponse.json({ ok: true, id, skipped: true })
    }

    // TYN-11: saving with a file runs it through the private-original hooks,
    // which publish a display copy of it. So the source must be the private
    // original whenever one exists: rebuilding from the public display copy
    // would shrink every size for good. A photo not moved yet still has its
    // full-resolution file public, so rebuilding it is also what moves it
    // into the private bucket (the TYN-11 backfill).
    const buffer = photo.originalKey
      ? await streamToBuffer((await r2OriginalsStore().get(photo.originalKey)).body as unknown as AsyncIterable<Uint8Array>)
      : await fetchBuffer(photo.url)
    await payload.update({
      collection: 'photos',
      id,
      data: {},
      // Builder pages and blog posts store photo URLs as plain strings, so
      // the rebuilt files must keep their names (Payload would otherwise
      // save first-dance-1.jpg and delete first-dance.jpg).
      overwriteExistingFiles: true,
      // Rebuilding from the private original itself: keep it where it is
      // rather than storing a second copy under a new key.
      ...(photo.originalKey ? { context: { [REUSE_ORIGINAL_KEY]: photo.originalKey } } : {}),
      file: {
        data: buffer,
        mimetype: photo.mimeType ?? 'image/jpeg',
        name: photo.filename ?? `photo-${id}.jpg`,
        size: buffer.length,
      },
      overrideAccess: false,
      user,
    })
    // Colour treatment, sharpening and the watermark are applied by the Photos
    // collection itself after any rebuild of the sizes (collections/photoSizePipeline.ts).
    // Doing them here too would apply the (non-idempotent) treatment twice.

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[regenerate-photo-sizes] failed:', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
