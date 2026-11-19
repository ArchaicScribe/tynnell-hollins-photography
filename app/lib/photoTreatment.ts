import sharp from 'sharp'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSiteDesign } from './siteDesign'
import { photoSaturation } from './siteTheme'
import { streamToBuffer } from './r2Stream'

// Photo colour treatment (muted, faded, black and white), baked into the web
// renditions when a photo is processed.
//
// It used to be a CSS filter on every <img>. A filter on a large photo is GPU work
// on every frame while scrolling, and measurably made the About page janky
// (2026-11-19). Baking it into the thumbnail, card and hero renditions costs
// nothing at scroll time and looks the same: the matrix below is the one CSS
// `saturate()` uses, applied to the same gamma-encoded sRGB values.
//
// Same shape as sharpening.ts: a best-effort post-process step after Payload has
// generated the sizes, overwriting each rendition in place at the same R2 key. The
// full original is never touched (clients download it as shot). It is not
// idempotent (running it twice mutes twice), so it only ever runs on freshly
// generated sizes. The Photos collection calls it after every rebuild of the sizes
// (collections/photoSizePipeline.ts): a new upload, the regenerate route, and a crop
// or focal point edit in the admin. Changing the treatment in /design therefore
// applies to new uploads, edited photos, and photos reprocessed with "Apply to all
// photos".
//
// Order in the pipeline: treatment, then sharpening, then watermark.

type SizeSlot = { filename?: string | null; mimeType?: string | null } | null | undefined

// The JPEG qualities collections/Photos.ts generates each size at, so the extra
// encode costs as little as possible.
const SLOT_QUALITY: Record<'thumbnail' | 'card' | 'hero', number> = { thumbnail: 80, card: 85, hero: 88 }

// The CSS filter-effects saturate(s) matrix.
type Row = [number, number, number]
export function saturationMatrix(s: number): [Row, Row, Row] {
  return [
    [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
  ]
}

// Natural colour (saturation 1) returns the input itself: nothing to bake, and no
// needless re-encode.
export async function treatBuffer(input: Buffer, saturation: number, quality: number): Promise<Buffer> {
  if (saturation === 1) return input
  return sharp(input).toColourspace('srgb').recomb(saturationMatrix(saturation)).jpeg({ quality }).toBuffer()
}

async function treatOneSize(params: { s3: S3Client; bucket: string; saturation: number; slot: SizeSlot; quality: number }) {
  const { s3, bucket, saturation, slot, quality } = params
  const key = slot?.filename
  if (!key) return

  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!Body) return
  const original = await streamToBuffer(Body as AsyncIterable<Uint8Array>)
  const treated = await treatBuffer(original, saturation, quality)

  await s3.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: treated, ContentType: slot?.mimeType ?? 'image/jpeg' }),
  )
}

export async function applyPhotoTreatmentIfEnabled(params: {
  s3: S3Client
  bucket: string
  sizes: { thumbnail?: SizeSlot; card?: SizeSlot; hero?: SizeSlot } | null | undefined
}): Promise<void> {
  const { s3, bucket, sizes } = params
  if (!sizes) return

  const theme = await getSiteDesign()
  const saturation = photoSaturation(theme.photoTreatment)
  if (saturation === 1) return

  const slots: ['thumbnail' | 'card' | 'hero', SizeSlot][] = [
    ['thumbnail', sizes.thumbnail],
    ['card', sizes.card],
    ['hero', sizes.hero],
  ]
  for (const [name, slot] of slots) {
    try {
      await treatOneSize({ s3, bucket, saturation, slot, quality: SLOT_QUALITY[name] })
    } catch (err) {
      console.warn(`[photo-treatment] failed to treat "${name}" size:`, err)
    }
  }
}
