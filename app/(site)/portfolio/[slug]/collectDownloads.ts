export type DownloadPhoto = {
  id: number
  filename: string | null
  url: string | null
}

export type CollectedDownloads = {
  files: Record<string, Uint8Array>
  failed: number
  // A 401 means the gallery password cookie is missing or stale. Every later
  // request would fail the same way, so collection stops at the first one.
  unauthorized: boolean
}

/**
 * Fetches each photo through the gallery-scoped download proxy and returns the
 * bytes keyed by a unique filename, plus how many could not be fetched. The
 * caller decides what to tell the visitor; nothing here fails silently.
 */
export async function collectDownloads(
  photos: DownloadPhoto[],
  gallerySlug: string,
  onProgress: (done: number) => void = () => {},
  fetchImpl: typeof fetch = fetch,
): Promise<CollectedDownloads> {
  const files: Record<string, Uint8Array> = {}
  const usedFilenames = new Set<string>()
  let failed = 0

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const proxyUrl = `/api/photos/${photo.id}/download?gallery=${encodeURIComponent(gallerySlug)}`
    let res: Response
    try {
      res = await fetchImpl(proxyUrl)
    } catch {
      failed++
      onProgress(i + 1)
      continue
    }
    if (res.status === 401) {
      return { files, failed: photos.length - Object.keys(files).length, unauthorized: true }
    }
    if (!res.ok) {
      failed++
      onProgress(i + 1)
      continue
    }

    const buf = await res.arrayBuffer()

    // Ensure unique filename within the zip.
    let base = photo.filename ?? `photo-${photo.id}.jpg`
    if (usedFilenames.has(base)) {
      const dot = base.lastIndexOf('.')
      const name = dot >= 0 ? base.slice(0, dot) : base
      const ext = dot >= 0 ? base.slice(dot) : ''
      base = `${name}-${i + 1}${ext}`
    }
    usedFilenames.add(base)
    files[base] = new Uint8Array(buf)
    onProgress(i + 1)
  }

  return { files, failed, unauthorized: false }
}
