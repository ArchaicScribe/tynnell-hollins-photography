import type { CollectionAfterOperationHook, CollectionBeforeChangeHook } from 'payload'
import type { Photo } from '@/payload-types'

// Payload rebuilds a photo's three web sizes (thumbnail, card, hero) from the original
// whenever a file goes in: a new upload, the regenerate route, and a crop or focal
// point edit in the admin. The rebuilt files come out at natural colour, unsharpened
// and unwatermarked, so they have to be finished afterwards (colour treatment,
// sharpening, watermark: app/lib/photoPostProcess.ts).
//
// Doing that in the collection, not in each caller, means no caller can forget it
// (a crop edit used to put a muted photo back to natural colour) and none can do it
// twice (the treatment mutes again every time it runs).
//
// Two hooks cooperate through the request context:
//  - beforeChange runs after Payload has built the sizes, so it can see that it did
//    (req.payloadUploadSizes is only filled when sizes were rebuilt) and notes it.
//  - afterOperation runs after the storage plugin has uploaded the new files to R2,
//    which a normal afterChange hook of ours would not (the plugin's own afterChange
//    is appended after ours), so the files exist to be read back and rewritten.
// A plain edit (title, featured, category) rebuilds nothing and is left alone.
//
// Known trade-off (PR #188 review): afterOperation runs before Payload commits the
// transaction, so the finishing steps (a few seconds per photo) hold the photo's row
// open. If the function were killed at its 60s limit mid-way, the save would roll back
// and the files already in R2 would be orphans, where the old route-level steps would
// have left a saved photo at natural colour. A failed save the admin sees and retries
// was judged better than a silently untreated photo; the steps' own errors never fail
// the save. Revisit (defer until after the commit) if upload timeouts ever show up.

const FLAG = 'photoSizesRebuilt'

export const flagRebuiltSizes: CollectionBeforeChangeHook = ({ data, req }) => {
  if (Object.keys(req.payloadUploadSizes ?? {}).length > 0) {
    req.context = req.context ?? {}
    req.context[FLAG] = true
  }
  return data
}

export const postProcessRebuiltSizes: CollectionAfterOperationHook = async ({ operation, req, result }) => {
  if (operation !== 'create' && operation !== 'updateByID') return result
  // The storage plugin saves the doc a second time with the stored file's metadata.
  // That is not a rebuild; wait for the real end of the operation.
  if (req.context?.skipCloudStorage) return result
  if (!req.context?.[FLAG]) return result
  req.context[FLAG] = false

  const doc = result as Partial<Photo>
  try {
    // Loaded on use, not at the top: the finishing steps read the site design, which
    // imports the Payload config, which imports this collection. A top-level import
    // would make that a cycle (and drag sharp into every file that imports Photos).
    const { postProcessPhotoSizes } = await import('@/app/lib/photoPostProcess')
    const { r2Bucket, r2Client } = await import('@/app/lib/r2')
    await postProcessPhotoSizes({
      s3: r2Client(),
      bucket: r2Bucket(),
      sizes: doc.sizes,
      main: { filename: doc.filename, mimeType: doc.mimeType },
      label: doc.filename ?? String(doc.id ?? 'photo'),
    })
  } catch (err) {
    // Never fail the save: the photo is stored, only its finishing step missed.
    console.warn('[photos] finishing the rebuilt sizes failed (non-fatal):', err)
  }
  return result
}
