// The file name to show or copy for a photo so it matches what Tynnell exported.
// Payload's stored `filename` carries a de-dup suffix ("name-1.jpg") when the
// same name was uploaded twice; `originalFilename` does not. Photos uploaded
// before it was kept have only the stored name.
export function fileNameForSearch(photo: { originalFilename?: string | null; filename?: string | null }): string | null {
  return photo.originalFilename || photo.filename || null
}
