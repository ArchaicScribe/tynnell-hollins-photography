import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import config from '@payload-config'
import { S3Client } from '@aws-sdk/client-s3'
import { applyWatermarkIfEnabled } from '@/app/lib/watermark'
import { applySharpeningIfEnabled } from '@/app/lib/sharpening'
import type { Photo } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Maintenance route for TYN-344 (site-wide blurry photos): the hero/card
// imageSizes in collections/Photos.ts were bumped to higher resolutions with
// an explicit JPEG quality, but that only affects NEW uploads. This
// regenerates ONE existing photo's preview sizes from its original file,
// re-running the same sharp resize + sharpening/watermark pipeline the real
// ingest route runs, so it ends up equivalent to a fresh upload. One photo
// per request (not a bulk loop) so it stays well inside Vercel's function
// time limit regardless of library size - call it once per photo ID from an
// authenticated admin session.
function buildS3Client(): S3Client {
  return new S3Client({
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
    region: 'auto',
    forcePathStyle: true,
  })
}

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
    const updated = (await payload.update({
      collection: 'photos',
      id,
      data: {},
      file: {
        data: buffer,
        mimetype: photo.mimeType ?? 'image/jpeg',
        name: photo.filename ?? `photo-${id}.jpg`,
        size: buffer.length,
      },
      overrideAccess: false,
      user,
    })) as Photo

    const s3 = buildS3Client()
    const bucket = process.env.R2_BUCKET ?? 'tynnell-hollins-photos'

    try {
      await applySharpeningIfEnabled({ s3, bucket, sizes: updated.sizes })
    } catch (err) {
      console.warn(`[regenerate-photo-sizes] sharpening failed for ${id} (non-fatal):`, err)
    }
    try {
      await applyWatermarkIfEnabled({ s3, bucket, sizes: updated.sizes })
    } catch (err) {
      console.warn(`[regenerate-photo-sizes] watermark failed for ${id} (non-fatal):`, err)
    }

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[regenerate-photo-sizes] failed:', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
