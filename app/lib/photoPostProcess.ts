import type { S3Client } from '@aws-sdk/client-s3'
import { applyPhotoTreatmentIfEnabled } from './photoTreatment'
import { applySharpeningIfEnabled } from './sharpening'
import { applyWatermarkIfEnabled } from './watermark'

type Sizes = Parameters<typeof applyPhotoTreatmentIfEnabled>[0]['sizes']

// Finishes a photo's web renditions after Payload has generated and stored them:
// colour treatment first (so the rest work on the final colours), then sharpening,
// then the watermark (so it is never re-sharpened). Each step is best-effort: one
// failing must not stop the others or fail the save. The full original is never touched.
//
// None of the steps is idempotent, so this runs exactly once per rebuild of the
// sizes. The Photos collection (collections/photoSizePipeline.ts) is the only caller.
export async function postProcessPhotoSizes(params: {
  s3: S3Client
  bucket: string
  sizes: Sizes
  label: string
}): Promise<void> {
  const { s3, bucket, sizes, label } = params

  const steps: [string, () => Promise<void>][] = [
    ['photo treatment', () => applyPhotoTreatmentIfEnabled({ s3, bucket, sizes })],
    ['sharpening', () => applySharpeningIfEnabled({ s3, bucket, sizes })],
    ['watermark', () => applyWatermarkIfEnabled({ s3, bucket, sizes })],
  ]

  for (const [name, run] of steps) {
    const start = Date.now()
    try {
      await run()
      console.log(`[photos] ${name} step for ${label} took ${Date.now() - start}ms`)
    } catch (err) {
      console.warn(`[photos] ${name} step failed for ${label} (non-fatal):`, err)
    }
  }
}
