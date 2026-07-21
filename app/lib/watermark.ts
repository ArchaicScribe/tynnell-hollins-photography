import sharp from 'sharp'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSiteDesign } from './siteDesign'
import { streamToBuffer } from './r2Stream'

// Watermarking (TYN-322): composites the site's configured watermark image
// onto a newly-uploaded photo's thumbnail/card/hero preview sizes - the ones
// actually rendered on public gallery/portfolio pages - overwriting them in
// place at the same R2 key. The full original (served by
// app/api/photos/[id]/download/route.ts for client downloads) is never
// touched. New uploads only - existing photos are unaffected.
//
// Called as a best-effort post-process step after payload.create() in
// app/api/photos/ingest/route.ts. Any failure here is logged and swallowed:
// the Photo record already exists and should not be rolled back just
// because the watermark step had a problem.

type SizeSlot = { filename?: string | null; mimeType?: string | null } | null | undefined

async function watermarkOneSize(params: {
  s3: S3Client
  bucket: string
  watermarkBuffer: Buffer
  slot: SizeSlot
}): Promise<void> {
  const { s3, bucket, watermarkBuffer, slot } = params
  const key = slot?.filename
  if (!key) return

  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!Body) return
  const original = await streamToBuffer(Body as AsyncIterable<Uint8Array>)

  const baseImage = sharp(original)
  const { width: baseWidth = 800 } = await baseImage.metadata()

  // Watermark scaled to ~20% of the base image's width, with a small
  // transparent margin on the bottom/right so it doesn't sit flush against
  // the edge.
  const targetWidth = Math.round(baseWidth * 0.2)
  const margin = Math.round(baseWidth * 0.03)
  const resizedWatermark = await sharp(watermarkBuffer)
    .resize({ width: targetWidth })
    .extend({ bottom: margin, right: margin, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  const composited = await baseImage
    .composite([{ input: resizedWatermark, gravity: 'southeast' }])
    .toBuffer()

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: composited,
      ContentType: slot?.mimeType ?? 'image/jpeg',
    })
  )
}

export async function applyWatermarkIfEnabled(params: {
  s3: S3Client
  bucket: string
  sizes: { thumbnail?: SizeSlot; card?: SizeSlot; hero?: SizeSlot } | null | undefined
}): Promise<void> {
  const { s3, bucket, sizes } = params
  if (!sizes) return

  const theme = await getSiteDesign()
  if (!theme.watermarkEnabled || !theme.watermarkUrl) return

  let watermarkBuffer: Buffer
  try {
    const res = await fetch(theme.watermarkUrl)
    if (!res.ok) {
      console.warn(`[watermark] failed to fetch watermark image (${res.status}): ${theme.watermarkUrl}`)
      return
    }
    watermarkBuffer = Buffer.from(await res.arrayBuffer())
  } catch (err) {
    console.warn('[watermark] failed to fetch watermark image:', err)
    return
  }

  const slots: [string, SizeSlot][] = [
    ['thumbnail', sizes.thumbnail],
    ['card', sizes.card],
    ['hero', sizes.hero],
  ]

  for (const [name, slot] of slots) {
    try {
      await watermarkOneSize({ s3, bucket, watermarkBuffer, slot })
    } catch (err) {
      console.warn(`[watermark] failed to watermark "${name}" size:`, err)
    }
  }
}
