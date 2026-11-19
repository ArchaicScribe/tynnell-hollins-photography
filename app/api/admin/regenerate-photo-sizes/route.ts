import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import config from '@payload-config'
import type { Photo } from '@/payload-types'

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
    try {
      const body = await request.json()
      id = body?.id
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

    const buffer = await fetchBuffer(photo.url)
    await payload.update({
      collection: 'photos',
      id,
      data: {},
      file: {
        data: buffer,
        mimetype: photo.mimeType ?? 'image/jpeg',
        name: photo.filename ?? `photo-${id}.jpg`,
        size: buffer.length,
      },
      // Keep the photo under its own filename. Without this Payload sees the photo's
      // own row already using the name, renames the file to "name-1.jpg" and deletes
      // the old original and sizes, which 404s every place that stored a size URL as
      // a plain string (page builder image fields, blog covers, menu cards).
      overwriteExistingFiles: true,
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
