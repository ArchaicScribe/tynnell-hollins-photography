import type { CollectionBeforeValidateHook } from 'payload'

// Payload renames a second upload of the same name to "name-1.jpg" and stores
// that as `filename`. The name of the file Tynnell exported (and will search
// for in Lightroom) is only known at upload time, so keep it then.
//
// Only on create: later updates carry the stored name back in as their file
// (the regenerate route does), which would overwrite the real original. The
// cost is that replacing a photo's file in the admin keeps the first name.
export const recordOriginalFilename: CollectionBeforeValidateHook = ({ data = {}, operation, req }) => {
  const uploaded = req?.file?.name
  if (operation === 'create' && uploaded) {
    data.originalFilename = uploaded
  }
  return data
}
