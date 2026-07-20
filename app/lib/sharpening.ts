import sharp from 'sharp'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSiteDesign } from './siteDesign'
import { streamToBuffer } from './r2Stream'

// Sharpening Level (TYN-325): sharpens a newly-uploaded photo's
// thumbnail/card/hero preview sizes - the ones actually rendered on public
// gallery/portfolio pages - overwriting them in place at the same R2 key.
// The full original (served by app/api/photos/[id]/download/route.ts for
// client downloads) is never touched, matching the watermark step's scope
// (app/lib/watermark.ts). New uploads only - existing photos are unaffected.
//
// This is a sitewide default rather than per-gallery: a Photo's preview sizes
// are generated once at ingest and shared across every gallery that later
// references it (Gallery.photos is a many-to-many join, not an ownership
// relationship), so there is no single "collection" to scope sharpening to at
// upload time.
//
// Called as a best-effort post-process step after payload.create(), before
// the watermark step (so the watermark itself is never re-sharpened) in
// app/api/photos/ingest/route.ts. Any failure here is logged and swallowed:
// the Photo record already exists and should not be rolled back just because
// this step had a problem.

type SizeSlot = { filename?: string | null; mimeType?: string | null } | null | undefined

const SHARPEN_SIGMA: Record<'subtle' | 'moderate' | 'strong', number> = {
  subtle: 0.5,
  moderate: 1,
  strong: 1.8,
}

async function sharpenOneSize(params: {
  s3: S3Client
  bucket: string
  sigma: number
  slot: SizeSlot
}): Promise<void> {
  const { s3, bucket, sigma, slot } = params
  const key = slot?.filename
  if (!key) return

  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!Body) return
  const original = await streamToBuffer(Body as AsyncIterable<Uint8Array>)

  const sharpened = await sharp(original).sharpen({ sigma }).toBuffer()

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: sharpened,
      ContentType: slot?.mimeType ?? 'image/jpeg',
    })
  )
}

export async function applySharpeningIfEnabled(params: {
  s3: S3Client
  bucket: string
  sizes: { thumbnail?: SizeSlot; card?: SizeSlot; hero?: SizeSlot } | null | undefined
}): Promise<void> {
  const { s3, bucket, sizes } = params
  if (!sizes) return

  const theme = await getSiteDesign()
  if (theme.sharpeningLevel === 'none') return
  const sigma = SHARPEN_SIGMA[theme.sharpeningLevel]

  const slots: [string, SizeSlot][] = [
    ['thumbnail', sizes.thumbnail],
    ['card', sizes.card],
    ['hero', sizes.hero],
  ]

  for (const [name, slot] of slots) {
    try {
      await sharpenOneSize({ s3, bucket, sigma, slot })
    } catch (err) {
      console.warn(`[sharpening] failed to sharpen "${name}" size:`, err)
    }
  }
}
