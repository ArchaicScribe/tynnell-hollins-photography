// Shared client-side photo-upload pipeline (TYN-220 / TYN-235): presign ->
// PUT to R2 -> ingest. Used by the builder image picker and the gallery
// arranger so the upload contract lives in one place instead of being copied.

export type IngestedPhoto = {
  id: number
  url?: string | null
  filename?: string | null
  alt?: string | null
  category?: string | null
  sizes?: {
    thumbnail?: { url?: string | null }
    card?: { url?: string | null }
    hero?: { url?: string | null }
  } | null
}

// Formats sharp can't process on Vercel (no native libheif) - reject up front.
export const UNSUPPORTED_IMAGE_EXTS = new Set(['heic', 'heif', 'avif', 'tiff', 'tif', 'bmp'])

export function isUnsupportedImage(file: File): boolean {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase()
  return UNSUPPORTED_IMAGE_EXTS.has(ext)
}

// Upload one image to the photo library. Throws a plain-English Error on any
// step failure; the caller owns UI state (progress, error display).
export async function uploadPhotoToLibrary(
  file: File,
  opts: { category?: string | null } = {},
): Promise<IngestedPhoto> {
  // 1. presigned PUT URL
  const pre = await fetch('/api/upload-presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  })
  if (!pre.ok) {
    const j = await pre.json().catch(() => ({}))
    throw new Error(j.error || 'Could not start the upload.')
  }
  const { uploadUrl, key } = await pre.json()

  // 2. PUT the file straight to R2
  const put = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
  if (!put.ok) throw new Error('Upload to storage failed.')

  // 3. ingest -> creates the Photo record (sharp resize)
  const ing = await fetch('/api/photos/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ key, filename: file.name, category: opts.category ?? null }),
  })
  if (!ing.ok) {
    const j = await ing.json().catch(() => ({}))
    throw new Error(j.error || 'Could not process the photo.')
  }
  return ing.json()
}
