'use client'
import { useField } from '@payloadcms/ui'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isUnsupportedImage, uploadPhotoToLibrary, type IngestedPhoto } from '@/app/lib/uploadPhoto'

// Visual gallery arranger (TYN-234 + TYN-235). Replaces the default vertical
// array-row UI for a gallery's photos with a Pixieset-style grid of large
// thumbnails: drag photos from the computer onto the grid to upload them,
// drag tiles to reorder, remove, and set the cover photo right from the grid.
// Reads/writes the same `photos` form path via useField, so the existing "Add
// Multiple Photos" button stays compatible.
// 'use client' + inline styles for resilience, matching the rest of the admin.
type PhotoRow = { id?: string; photo: number | null }
type PhotoDoc = IngestedPhoto

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

  // Fetch thumbnails only for the photos actually in this gallery, deferred past
  // the initial paint so the rest of the gallery form renders immediately.
  useEffect(() => {
    let active = true
    const ids = photos
      .map((r) => (typeof r.photo === 'number' ? r.photo : null))
      .filter((id): id is number => id !== null)
    if (ids.length === 0) return
    const params = new URLSearchParams({ limit: String(ids.length + 10), depth: '1' })
    params.append('where[id][in]', ids.join(','))
    // Defer the fetch so the admin form finishes its initial render first.
    const timer = setTimeout(() => {
      if (!active) return
      fetch(`/api/photos?${params.toString()}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((data: { docs?: PhotoDoc[] }) => {
          if (!active) return
          const map: Record<number, PhotoDoc> = {}
          for (const d of data.docs ?? []) map[d.id] = d
          setDocs(map)
        })
        .catch(() => {})
    }, 120)
    return () => {
      active = false
      clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.map((r) => (typeof r.photo === 'number' ? r.photo : null)).join(',')])

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

  const handleFiles = async (fileList: FileList | File[]) => {
    setUploadError('')
    const all = Array.from(fileList)
    const accepted: File[] = []
    let rejected = 0
    for (const f of all) {
      if (isUnsupportedImage(f) || !f.type.startsWith('image/')) rejected++
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
        // Tag the upload with this gallery's category so the library stays tidy.
        const doc = await uploadPhotoToLibrary(accepted[i], { category })
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
    border: `2px solid ${overIdx === i && dragIdx !== null ? 'rgba(214,209,206,0.8)' : 'rgba(155,154,154,0.18)'}`,
    opacity: dragIdx === i ? 0.4 : 1,
    boxSizing: 'border-box',
    background: '#1a1a1a',
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

  return (
    <div
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes('Files')) {
          e.preventDefault()
          if (!fileOver) setFileOver(true)
        }
      }}
      onDragLeave={(e) => {
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
        border: `2px dashed ${fileOver ? 'rgba(214,209,206,0.8)' : count === 0 ? 'rgba(155,154,154,0.2)' : 'transparent'}`,
        borderRadius: 8,
        transition: 'border-color .12s ease',
        padding: count === 0 ? '0' : '0.25rem 0',
      }}
    >
      {count === 0 ? (
        /* Empty state — prominent drop zone with full workflow explanation */
        <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.6rem', opacity: 0.35 }} aria-hidden="true">&#128444;</div>
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.9rem', fontWeight: 600, color: '#d6d1ce', fontFamily: 'Archivo, sans-serif' }}>
            {fileOver ? 'Drop photos to upload them' : 'No photos in this gallery yet'}
          </p>
          {!fileOver && (
            <>
              <p style={{ margin: '0 0 1.1rem', fontSize: '0.78rem', color: '#9b9a9a', lineHeight: 1.5 }}>
                Add photos using the <strong style={{ color: '#b8b4b1' }}>Add Multiple Photos</strong> button above, or drag image files directly onto this area to upload them. Once photos are added you can drag the tiles to reorder them — the order here is exactly the order they appear on your gallery page.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-busy={uploading}
                style={{ background: 'rgba(155,154,154,0.14)', border: '1px solid rgba(155,154,154,0.3)', color: '#e6e1de', borderRadius: 4, padding: '0.45rem 1.1rem', fontSize: '0.8rem', cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.6 : 1, fontFamily: 'Archivo, sans-serif' }}
              >
                {uploading && progress ? `Uploading ${progress.done}/${progress.total}...` : 'Browse files'}
              </button>
            </>
          )}
        </div>
      ) : (
        /* Populated state — upload bar + reorder strip + grid */
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#b8b4b1', letterSpacing: '0.03em' }}>
              {fileOver ? 'Drop to upload these photos' : 'Drag image files here to add more, or'}
              {!fileOver && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  aria-busy={uploading}
                  style={{ marginLeft: '0.4rem', background: 'rgba(155,154,154,0.14)', border: '1px solid rgba(155,154,154,0.3)', color: '#e6e1de', borderRadius: 4, padding: '0.25rem 0.7rem', fontSize: '0.75rem', cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.6 : 1 }}
                >
                  {uploading && progress ? `Uploading ${progress.done}/${progress.total}...` : 'Browse'}
                </button>
              )}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#9b9a9a' }}>
              {count} photo{count !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.7rem', padding: '0.35rem 0.5rem', background: 'rgba(155,154,154,0.06)', borderRadius: 4, border: '1px solid rgba(155,154,154,0.1)' }}>
            <span style={{ fontSize: '1rem', lineHeight: 1, color: '#9b9a9a' }} aria-hidden="true">&#8942;&#8942;</span>
            <span style={{ fontSize: '0.75rem', color: '#9b9a9a' }}>
              Drag the photos below to reorder them. The order here is the order they appear on your gallery page.
            </span>
          </div>

          {uploadError && (
            <div role="alert" style={{ color: '#f0a3a3', fontSize: '0.74rem', marginBottom: '0.6rem' }}>{uploadError}</div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '0.55rem',
            }}
          >
          {photos.map((row, i) => {
            // Payload may store the relationship as a number ID or a resolved object
            const rawPid = row.photo
            const pid: number | null =
              typeof rawPid === 'number'
                ? rawPid
                : rawPid !== null && typeof rawPid === 'object'
                  ? ((rawPid as { id?: number }).id ?? null)
                  : null
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
                  <img
                    src={src}
                    alt={doc?.alt ?? doc?.filename ?? ''}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.4rem', textAlign: 'center' }}>
                    <span aria-hidden="true" style={{ fontSize: '1.4rem', opacity: 0.3 }}>&#128247;</span>
                    {doc?.filename && (
                      <span style={{ fontSize: '0.55rem', color: '#9b9a9a', wordBreak: 'break-all', lineHeight: 1.3, maxHeight: '2.6em', overflow: 'hidden' }}>{doc.filename}</span>
                    )}
                  </div>
                )}

                {/* Drag handle - visible grip indicator */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 4px)',
                    gap: '3px',
                    opacity: dragIdx === i ? 0 : 0.55,
                    pointerEvents: 'none',
                    transition: 'opacity .15s',
                  }}
                >
                  {Array.from({ length: 6 }).map((_, d) => (
                    <div key={d} style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff' }} />
                  ))}
                </div>

                {/* Position number */}
                <span style={{ ...badge, top: '0.3rem', left: '0.3rem', background: 'rgba(0,0,0,0.6)', color: '#d6d1ce' }}>{i + 1}</span>

                {/* Cover badge / set-cover */}
                {isCover ? (
                  <span style={{ ...badge, bottom: '0.3rem', left: '0.3rem', background: 'rgba(201,162,39,0.92)', color: '#0c0c0c', fontWeight: 700, textTransform: 'uppercase' }}><span aria-hidden="true">★ </span>Cover</span>
                ) : (
                  pid !== null && (
                    <button
                      type="button"
                      onClick={() => setCover(pid)}
                      title="Set as the gallery cover photo"
                      aria-label={`Set photo ${i + 1} as the gallery cover`}
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
        </>
      )}

      {/* Hidden file input — always in DOM so both empty-state and populated Browse buttons work */}
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

      {/* Upload error — shown outside the conditional so it persists across state changes */}
      {count === 0 && uploadError && (
        <div role="alert" style={{ color: '#f0a3a3', fontSize: '0.74rem', margin: '0.4rem 0.5rem 0' }}>{uploadError}</div>
      )}
    </div>
  )
}
