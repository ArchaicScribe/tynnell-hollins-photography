import sharp, { type Sharp } from 'sharp'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSiteDesign } from './siteDesign'
import { photoSaturation } from './siteTheme'
import { streamToBuffer } from './r2Stream'

// Finishes a photo's web renditions (thumbnail, card, hero) after Payload has
// generated and stored them: colour treatment, then sharpening, then the watermark.
// Each rendition is downloaded once, all three steps run in memory, and it is encoded
// once, at the quality Payload generated that size with, and uploaded in place at the
// same R2 key. The full original (served for client downloads) is never touched.
//
// It used to be three separate download, transform, JPEG-encode, upload passes. JPEG
// is lossy, so each extra encode costs detail, and the sharpening and watermark passes
// re-encoded at sharp's default quality 80 even for the card (85) and hero (88). Here
// the steps hand each other raw pixels, so there is exactly one lossy pass.
//
// - Colour treatment (muted, faded, black and white) was a CSS filter on every <img>,
//   which made large photos janky to scroll (About, 2026-11-19). Baked in, it costs
//   nothing at scroll time and looks the same: the matrix is the one CSS saturate()
//   uses, applied to the same gamma-encoded sRGB values.
// - Sharpening Level (TYN-325): a sitewide default, not per gallery, because a photo's
//   sizes are generated once and shared by every gallery that references it.
// - Watermark (TYN-322): the configured image at about a fifth of the width, bottom
//   right. It goes on after sharpening so its own hard edge is never sharpened.
//
// None of it is idempotent (the treatment mutes again every run), so it only ever runs
// on freshly generated sizes. The Photos collection calls it after every rebuild of the
// sizes (collections/photoSizePipeline.ts): a new upload, the regenerate route, and a
// crop or focal point edit in the admin. Best-effort: a failing size is logged and left
// as Payload made it, it never fails a save.

type SizeSlot = { filename?: string | null; mimeType?: string | null } | null | undefined

export type FinishPlan = {
  /** 1 is natural colour (no treatment). */
  saturation: number
  /** Gaussian sigma for sharpening, or null for none. */
  sharpenSigma: number | null
  /** The watermark image, or null for none. */
  watermark: Buffer | null
}

// The JPEG qualities collections/Photos.ts generates each size at.
const SLOT_QUALITY: Record<'thumbnail' | 'card' | 'hero', number> = { thumbnail: 80, card: 85, hero: 88 }

const SHARPEN_SIGMA: Record<'subtle' | 'moderate' | 'strong', number> = {
  subtle: 0.5,
  moderate: 1,
  strong: 1.8,
}

// The CSS filter-effects saturate(s) matrix.
type Row = [number, number, number]
export function saturationMatrix(s: number): [Row, Row, Row] {
  return [
    [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
  ]
}

const isNoop = (plan: FinishPlan) => plan.saturation === 1 && plan.sharpenSigma === null && plan.watermark === null

// Raw pixels, so the next step starts from exactly what this one produced.
async function materialise(image: Sharp): Promise<Sharp> {
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
}

/**
 * One rendition in, one rendition out. Returns the input itself when there is nothing to do.
 * A watermark that cannot be laid on (not an image, or too tall to fit) costs the photo only
 * its watermark: the colour treatment and sharpening are still applied.
 */
export async function finishBuffer(input: Buffer, plan: FinishPlan, quality: number): Promise<Buffer> {
  if (!plan.watermark) return finishWith(input, plan, quality)
  try {
    return await finishWith(input, plan, quality)
  } catch (err) {
    console.warn('[photo-finish] the watermark could not be applied, finishing without it:', err)
    return finishWith(input, { ...plan, watermark: null }, quality)
  }
}

async function finishWith(input: Buffer, plan: FinishPlan, quality: number): Promise<Buffer> {
  if (isNoop(plan)) return input

  const steps: ((image: Sharp) => Sharp)[] = []
  if (plan.saturation !== 1) {
    steps.push((image) => image.toColourspace('srgb').recomb(saturationMatrix(plan.saturation)))
  }
  if (plan.sharpenSigma !== null) {
    const sigma = plan.sharpenSigma
    steps.push((image) => image.sharpen({ sigma }))
  }
  if (plan.watermark) {
    // Scaled to ~20% of the image's width, with a small transparent margin on the
    // bottom and right so it does not sit flush against the edge.
    const { width = 800 } = await sharp(input).metadata()
    const overlay = await sharp(plan.watermark)
      .resize({ width: Math.round(width * 0.2) })
      .extend({ bottom: Math.round(width * 0.03), right: Math.round(width * 0.03), background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer()
    steps.push((image) => image.composite([{ input: overlay, gravity: 'southeast' }]))
  }

  let image = sharp(input)
  for (let i = 0; i < steps.length; i++) {
    image = steps[i](image)
    if (i < steps.length - 1) image = await materialise(image)
  }
  return image.jpeg({ quality }).toBuffer()
}

/** What to do to every rendition, from the site design. Fetches the watermark image once. */
export async function loadFinishPlan(): Promise<FinishPlan> {
  const theme = await getSiteDesign()

  let watermark: Buffer | null = null
  if (theme.watermarkEnabled && theme.watermarkUrl) {
    try {
      const res = await fetch(theme.watermarkUrl)
      if (res.ok) watermark = Buffer.from(await res.arrayBuffer())
      else console.warn(`[photo-finish] failed to fetch watermark image (${res.status}): ${theme.watermarkUrl}`)
    } catch (err) {
      console.warn('[photo-finish] failed to fetch watermark image:', err)
    }
  }

  return {
    saturation: photoSaturation(theme.photoTreatment),
    sharpenSigma: theme.sharpeningLevel === 'none' ? null : SHARPEN_SIGMA[theme.sharpeningLevel],
    watermark,
  }
}

async function finishOneSize(params: { s3: S3Client; bucket: string; plan: FinishPlan; slot: SizeSlot; quality: number }) {
  const { s3, bucket, plan, slot, quality } = params
  const key = slot?.filename
  if (!key) return

  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!Body) return
  const input = await streamToBuffer(Body as AsyncIterable<Uint8Array>)
  const output = await finishBuffer(input, plan, quality)
  if (output === input) return // nothing was applied to this size

  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: output, ContentType: slot?.mimeType ?? 'image/jpeg' }))
}

export async function finishPhotoSizes(params: {
  s3: S3Client
  bucket: string
  sizes: { thumbnail?: SizeSlot; card?: SizeSlot; hero?: SizeSlot } | null | undefined
  /** For log lines only. */
  label?: string
}): Promise<void> {
  const { s3, bucket, sizes, label = 'photo' } = params
  if (!sizes) return

  const plan = await loadFinishPlan()
  if (isNoop(plan)) return

  const slots: ['thumbnail' | 'card' | 'hero', SizeSlot][] = [
    ['thumbnail', sizes.thumbnail],
    ['card', sizes.card],
    ['hero', sizes.hero],
  ]
  const start = Date.now()
  for (const [name, slot] of slots) {
    try {
      await finishOneSize({ s3, bucket, plan, slot, quality: SLOT_QUALITY[name] })
    } catch (err) {
      console.warn(`[photo-finish] failed to finish the "${name}" size of ${label} (non-fatal):`, err)
    }
  }
  console.log(`[photo-finish] finished the sizes of ${label} in ${Date.now() - start}ms`)
}
