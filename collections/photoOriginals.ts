import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeOperationHook,
} from 'payload'
import { keepPrivateOriginal, type OriginalsStore, type UploadedFile } from '@/app/lib/privateOriginals'

// TYN-11: keeps every photo's full-resolution file in a private bucket and
// publishes a display-size copy in its place, so the gallery download route
// is the only way to reach an original.
//
// beforeOperation runs before Payload reads `req.file` (generateFileData), so
// swapping the file there means Payload stores and resizes the display copy.
// A save that carries no new file (a title edit, a focal-point change that
// re-processes the already-public file) has no `req.file` and is left alone.

async function removeOriginal(store: () => OriginalsStore, key: string, why: string) {
  try {
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
      const kept = await keepPrivateOriginal(file, store())
      req.file = { ...req.file!, ...kept.file }
      req.context.originalKey = kept.originalKey
    }
    return args
  }

  const beforeChange: CollectionBeforeChangeHook = ({ data, context }) => {
    if (typeof context.originalKey === 'string') data.originalKey = context.originalKey
    return data
  }

  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation }) => {
    const old = previousDoc?.originalKey
    if (operation === 'update' && old && old !== doc.originalKey) await removeOriginal(store, old, 'file replaced')
    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
    if (doc?.originalKey) await removeOriginal(store, doc.originalKey, 'photo deleted')
    return doc
  }

  return { beforeOperation, beforeChange, afterChange, afterDelete }
}
