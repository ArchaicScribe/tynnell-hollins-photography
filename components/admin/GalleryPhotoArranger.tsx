'use client'
import { useField } from '@payloadcms/ui'
import { useEffect, useMemo, useRef, useState } from 'react'

// Visual gallery arranger (TYN-234 + TYN-235). Replaces the default vertical
// array-row UI for a gallery's photos with a Pixieset-style grid of large
// thumbnails: drag photos from the computer onto the grid to upload them,
// drag tiles to reorder, remove, and set the cover photo right from the grid.
// Reads/writes the same `photos` form path via useField, so the existing "Add
// Multiple Photos" button stays compatible.
// 'use client' + inline styles for resilience, matching the rest of the admin.
type PhotoRow = { id?: string; photo: number | null }
type PhotoDoc = {
  id: number
  url?: string | null
  filename?: string | null
  alt?: string | null
  sizes?: { thumbnail?: { url?: string | null }; card?: { url?: string | null } } | null
}

// Formats sharp can't process on Vercel (no native libheif) - reject up front.
const UNSUPPORTED_EXTS = new Set(['heic', 'heif', 'avif', 'tiff', 'tif', 'bmp'])

function thumbOf(p: PhotoDoc | undefined): string | null {
  if (!p) return null
  return p.sizes?.thumbnail?.url ?? p.sizes?.card?.url ?? p.url ?? null
}

export function GalleryPhotoArranger() {
  const { value: rawPhotos, setValue: setPhotos } = useField<PhotoRow[]>({ path: 'photos' })
  const { value: rawCover, setValue: setCover } = useField<number | { id?: number } | null>({ path: 'coverPhoto' })
  const category = useField<string | null>({ path: 'category' }).value ?? null

  // On a brand-new (unsaved) gallery Payload reports an array field's value as
  // its row count (the number 0), not an array. Guard with Array.isArray.
  const photos: PhotoRow[] = Array.isArray(rawPhotos) ? rawPhotos : []
  const coverId = typeof rawCover === 'object' && rawCover !== null ? rawCover.id ?? null : (rawCover as number | null)

  const [docs, setDocs] = useState<Record<number, PhotoDoc>>({})
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [fileOver, setFileOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load the library once to resolve each row's thumbnail.
  useEffect(() => {
    let active = true
    fetch('/api/photos?limit=500&depth=0', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { docs?: PhotoDoc[] }) => {
        if (!active) return
        const map: Record<number, PhotoDoc> = {}
        for (const d of data.docs ?? []) map[d.id] = d
        setDocs(map)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const count = photos.length

  const move = (from: number | null, to: number) => {
    if (from === null || from === to) return
    const next = [...photos]
    const [m] = next.splice(from, 1)
    next.splice(to, 0, m)
    setPhotos(next)
  }

  const remove = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx))
  }

  // Upload one file via the same presign -> R2 -> ingest flow the photo library
  // and image picker use. Returns the created Photo doc, or throws.
  const uploadOne = async (file: File): Promise<PhotoDoc> => {
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

    const put = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
    if (!put.ok) throw new Error('Upload to storage failed.')

    const ing = await fetch('/api/photos/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      // Tag the upload with this gallery's category so the library stays tidy.
      body: JSON.stringify({ key, filename: file.name, category }),
    })
    if (!ing.ok) {
      const j = await ing.json().catch(() => ({}))
      throw new Error(j.error || 'Could not process the photo.')
    }
    return ing.json()
  }

  const handleFiles = async (fileList: FileList | File[]) => {
    setUploadError('')
    const all = Array.from(fileList)
    const accepted: File[] = []
    let rejected = 0
    for (const f of all) {
      const ext = (f.name.split('.').pop() ?? '').toLowerCase()
      if (UNSUPPORTED_EXTS.has(ext) || !f.type.startsWith('image/')) rejected++
      else accepted.push(f)
    }
    if (rejected > 0) {
      setUploadError(`${rejected} file${rejected !== 1 ? 's were' : ' was'} skipped (HEIC and non-image files are not supported - export as JPEG).`)
    }
    if (accepted.length === 0) return

    setUploading(true)
    setProgress({ done: 0, total: accepted.length })
    const base = photos
    const newRows: PhotoRow[] = []
    const newDocs: Record<number, PhotoDoc> = {}
    for (let i = 0; i < accepted.length; i++) {
      try {
        const doc = await uploadOne(accepted[i])
        newRows.push({ id: crypto.randomUUID(), photo: doc.id })
        newDocs[doc.id] = doc
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : 'Upload failed.')
      }
      setProgress({ done: i + 1, total: accepted.length })
    }
    if (newRows.length) {
      setDocs((prev) => ({ ...prev, ...newDocs }))
      setPhotos([...base, ...newRows])
    }
    setUploading(false)
    setProgress(null)
  }

  const tileStyle = (i: number): React.CSSProperties => ({
    position: 'relative',
    aspectRatio: '1',
    borderRadius: 5,
    overflow: 'hidden',
    cursor: 'grab',
    border: `2px solid ${overIdx === i && dragIdx !== null ? 'rgba(214,209,206,0.8)' : 'transparent'}`,
    opacity: dragIdx === i ? 0.4 : 1,
    boxSizing: 'border-box',
    background: '#0c0c0c',
    transition: 'opacity .12s ease, border-color .12s ease',
  })

  const badge: React.CSSProperties = {
    position: 'absolute',
    fontSize: '0.6rem',
    letterSpacing: '0.04em',
    lineHeight: 1,
    padding: '0.18rem 0.32rem',
    borderRadius: 3,
  }

  const empty = useMemo(
    () => (
      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9b9a9a', fontSize: '0.85rem' }}>
        No photos yet. Drag photos here to upload, or use <strong>Browse</strong> above.
      </div>
    ),
    [],
  )

  return (
    <div
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes('Files')) {
          e.preventDefault()
          if (!fileOver) setFileOver(true)
        }
      }}
      onDragLeave={(e) => {
        // Only clear when leaving the whole arranger, not moving between tiles.
        if (e.currentTarget === e.target) setFileOver(false)
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files?.length) {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }
        setFileOver(false)
      }}
      style={{
        paddingTop: '0.25rem',
        border: `2px dashed ${fileOver ? 'rgba(214,209,206,0.8)' : 'transparent'}`,
        borderRadius: 8,
        transition: 'border-color .12s ease',
      }}
    >
      {/* Upload bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: '#b8b4b1', letterSpacing: '0.03em' }}>
          {fileOver ? 'Drop to upload these photos' : 'Drag photos here to upload, or'}
          {!fileOver && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ marginLeft: '0.4rem', background: 'rgba(155,154,154,0.14)', border: '1px solid rgba(155,154,154,0.3)', color: '#e6e1de', borderRadius: 4, padding: '0.25rem 0.7rem', fontSize: '0.75rem', cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.6 : 1 }}
            >
              {uploading && progress ? `Uploading ${progress.done}/${progress.total}...` : 'Browse'}
            </button>
          )}
        </span>
        <span style={{ fontSize: '0.72rem', color: '#6b6a6a' }}>
          {count > 0 ? `${count} photo${count !== 1 ? 's' : ''} · drag to reorder · order = order on the site` : ''}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {uploadError && (
        <div style={{ color: '#f0a3a3', fontSize: '0.74rem', marginBottom: '0.6rem' }}>{uploadError}</div>
      )}

      {count === 0 ? (
        empty
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '0.55rem',
          }}
        >
          {photos.map((row, i) => {
            const pid = typeof row.photo === 'number' ? row.photo : null
            const doc = pid !== null ? docs[pid] : undefined
            const src = thumbOf(doc)
            const isCover = pid !== null && pid === coverId
            return (
              <div
                key={row.id ?? `${pid}-${i}`}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragEnter={() => dragIdx !== null && setOverIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  move(dragIdx, i)
                  setDragIdx(null)
                  setOverIdx(null)
                }}
                onDragEnd={() => {
                  setDragIdx(null)
                  setOverIdx(null)
                }}
                style={tileStyle(i)}
                title={doc?.filename ?? undefined}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={doc?.alt ?? doc?.filename ?? ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.6rem', textAlign: 'center', padding: '0 0.3rem' }}>
                    {pid !== null ? 'Preview on live site' : 'No photo'}
                  </div>
                )}

                {/* Position number */}
                <span style={{ ...badge, top: '0.3rem', left: '0.3rem', background: 'rgba(0,0,0,0.6)', color: '#d6d1ce' }}>{i + 1}</span>

                {/* Cover badge / set-cover */}
                {isCover ? (
                  <span style={{ ...badge, bottom: '0.3rem', left: '0.3rem', background: 'rgba(201,162,39,0.92)', color: '#0c0c0c', fontWeight: 700, textTransform: 'uppercase' }}>★ Cover</span>
                ) : (
                  pid !== null && (
                    <button
                      type="button"
                      onClick={() => setCover(pid)}
                      title="Set as the gallery cover photo"
                      style={{ ...badge, bottom: '0.3rem', left: '0.3rem', background: 'rgba(0,0,0,0.6)', color: '#d6d1ce', border: 'none', cursor: 'pointer' }}
                    >
                      Set cover
                    </button>
                  )
                )}

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  title="Remove from gallery"
                  aria-label="Remove from gallery"
                  style={{
                    position: 'absolute',
                    top: '0.3rem',
                    right: '0.3rem',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0,0,0,0.62)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    lineHeight: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  &times;
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
