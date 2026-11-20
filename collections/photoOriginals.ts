import type {
  CollectionAfterDeleteHook,
  CollectionAfterOperationHook,
  CollectionBeforeChangeHook,
  CollectionBeforeOperationHook,
  PayloadRequest,
} from 'payload'
import { displayCopy, keepPrivateOriginal, type OriginalsStore, type UploadedFile } from '@/app/lib/privateOriginals'

// TYN-11: keeps every photo's full-resolution file in a private bucket and
// publishes a display-size copy in its place, so the gallery download route
// is the only way to reach an original.
//
// beforeOperation runs before Payload reads `req.file` (generateFileData), so
// swapping the file there means Payload stores and resizes the display copy.
// A save that carries no new file (a title edit, a focal-point change that
// re-processes the already-public file) has no `req.file` and is left alone.
//
// A replaced original is deleted in afterOperation, not afterChange: the
// storage plugin uploads the public file in its own afterChange, which runs
// after ours, and if that fails Payload rolls the photo back to the old key.

// Set by server code (the regenerate-photo-sizes route) that rebuilds a photo
// from its own private original: keep that key instead of storing it again.
export const REUSE_ORIGINAL_KEY = 'reuseOriginalKey'
const REPLACED = 'replacedOriginalKeys'

// A duplicated photo, or one whose key was set by hand, shares the file, so
// it is only deleted once no saved photo points at it any more.
async function removeIfUnused(store: () => OriginalsStore, req: PayloadRequest, key: string, why: string) {
  try {
    const { totalDocs } = await req.payload.count({ collection: 'photos', where: { originalKey: { equals: key } }, req })
    if (totalDocs > 0) return
    await store().delete(key)
  } catch (err) {
    // The photo is already saved or deleted; a leftover private file costs
    // storage, not correctness, so it must not undo that.
    console.warn(`[photos] could not delete private original "${key}" (${why}):`, err)
  }
}

export function photoOriginalHooks(store: () => OriginalsStore) {
  const beforeOperation: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
    const file = req.file as UploadedFile | undefined
    if ((operation === 'create' || operation === 'update') && file?.data) {
      const reuse = req.context[REUSE_ORIGINAL_KEY]
      const kept = typeof reuse === 'string'
        ? { file: await displayCopy(file), originalKey: reuse }
        : await keepPrivateOriginal(file, store())
      req.file = { ...req.file!, ...kept.file }
      req.context.originalKey = kept.originalKey
    }
    return args
  }

  const beforeChange: CollectionBeforeChangeHook = ({ data, originalDoc, context }) => {
    const key = context.originalKey
    if (typeof key !== 'string') return data
    data.originalKey = key
    const old = originalDoc?.originalKey
    if (old && old !== key) {
      const queued = (context[REPLACED] as string[] | undefined) ?? []
      if (!queued.includes(old)) context[REPLACED] = [...queued, old]
    }
    return data
  }

  const afterOperation: CollectionAfterOperationHook = async ({ req, result }) => {
    const queued = req.context[REPLACED] as string[] | undefined
    // Taken off the request before deleting: the storage plugin re-saves the
    // photo with this same request, so the list must only be acted on once.
    delete req.context[REPLACED]
    for (const key of queued ?? []) await removeIfUnused(store, req, key, 'file replaced')
    return result
  }

  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (doc?.originalKey) await removeIfUnused(store, req, doc.originalKey, 'photo deleted')
    return doc
  }

  return { beforeOperation, beforeChange, afterOperation, afterDelete }
}
