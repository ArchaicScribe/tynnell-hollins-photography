'use client'
import { useField } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'
import { isUnsupportedImage, uploadPhotoToLibrary, type IngestedPhoto } from '@/app/lib/uploadPhoto'

type PhotoRow = { id?: string; photo: number | { id?: number } | null }
type PhotoDoc = IngestedPhoto

function getPhotoId(photo: PhotoRow['photo']): number | null {
  if (typeof photo === 'number') return photo
  if (photo !== null && typeof photo === 'object') return photo.id ?? null
  return null
}

function thumbOf(p: PhotoDoc | undefined): string | null {
  if (!p) return null
  return p.sizes?.thumbnail?.url ?? p.sizes?.card?.url ?? p.url ?? null
}

export function GalleryPhotoArranger() {
  const { value: rawPhotos, setValue: setPhotos } = useField<PhotoRow[]>({ path: 'photos' })
  const { value: rawCover, setValue: setCoverField } = useField<number | { id?: number } | null>({ path: 'coverPhoto' })
  const category = useField<string | null>({ path: 'category' }).value ?? null

  const photos: PhotoRow[] = Array.isArray(rawPhotos) ? rawPhotos : []
  const count = photos.length
  const coverId = getPhotoId(rawCover as PhotoRow['photo'])

  const [docs, setDocs] = useState<Record<number, PhotoDoc>>({})
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [fileOver, setFileOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch thumbnails deferred so the form renders first
  useEffect(() => {
    let active = true
    const ids = photos.map((r) => getPhotoId(r.photo)).filter((id): id is number => id !== null)
    if (ids.length === 0) return
    const params = new URLSearchParams({ limit: String(ids.length + 10), depth: '1' })
    params.append('where[id][in]', ids.join(','))
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
    }, 150)
    return () => { active = false; clearTimeout(timer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.map((r) => getPhotoId(r.photo)).join(',')])

  const move = (from: number | null, to: number) => {
    if (from === null || from === to) return
    const next = [...photos]
    const [m] = next.splice(from, 1)
    next.splice(to, 0, m)
    setPhotos(next)
  }

  const remove = (idx: number) => setPhotos(photos.filter((_, i) => i !== idx))

  const setCover = (pid: number) => setCoverField(pid)

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
      setUploadError(`${rejected} file${rejected !== 1 ? 's' : ''} skipped (HEIC not supported - export as JPEG).`)
    }
    if (accepted.length === 0) return
    setUploading(true)
    setProgress({ done: 0, total: accepted.length })
    const base = photos
    const newRows: PhotoRow[] = []
    const newDocs: Record<number, PhotoDoc> = {}
    for (let i = 0; i < accepted.length; i++) {
      try {
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

  const outerStyle: React.CSSProperties = {
    paddingTop: '0.5rem',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  }

  const uploadBtnStyle: React.CSSProperties = {
    background: 'rgba(155,154,154,0.14)',
    border: '1px solid rgba(155,154,154,0.3)',
    color: '#e6e1de',
    borderRadius: 4,
    padding: '0.3rem 0.8rem',
    fontSize: '0.78rem',
    cursor: uploading ? 'default' : 'pointer',
    opacity: uploading ? 0.6 : 1,
    fontFamily: 'Archivo, sans-serif',
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '0.6rem',
  }

  return (
    <div
      style={outerStyle}
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes('Files')) {
          e.preventDefault()
          if (!fileOver) setFileOver(true)
        }
      }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setFileOver(false) }}
      onDrop={(e) => {
        if (e.dataTransfer.files?.length) { e.preventDefault(); handleFiles(e.dataTransfer.files) }
        setFileOver(false)
      }}
    >
      {/* Header row */}
      <div style={headerStyle}>
        <span style={{ fontSize: '0.78rem', color: '#9b9a9a' }}>
          {count > 0
            ? `${count} photo${count !== 1 ? 's' : ''} — drag to reorder`
            : fileOver ? 'Drop photos to upload' : 'No photos yet — drag files here or browse'}
        </span>
        <button
          type="button"
          style={uploadBtnStyle}
          disabled={uploading}
          aria-busy={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading && progress ? `Uploading ${progress.done}/${progress.total}...` : '+ Upload photos'}
        </button>
      </div>

      {uploadError && (
        <div role="alert" style={{ color: '#f0a3a3', fontSize: '0.75rem', marginBottom: '0.6rem' }}>{uploadError}</div>
      )}

      {count === 0 ? (
        /* Drop zone placeholder */
        <div
          style={{
            border: `2px dashed ${fileOver ? 'rgba(214,209,206,0.7)' : 'rgba(155,154,154,0.22)'}`,
            borderRadius: 8,
            padding: '2.5rem 1rem',
            textAlign: 'center',
            transition: 'border-color .12s',
            background: fileOver ? 'rgba(155,154,154,0.04)' : 'transparent',
          }}
        >
          <div style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '0.5rem' }} aria-hidden="true">&#128444;</div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#9b9a9a', lineHeight: 1.5 }}>
            Use <strong style={{ color: '#b8b4b1' }}>Add Multiple Photos</strong> above to pick from your library,<br />
            or drag image files here to upload directly.
          </p>
        </div>
      ) : (
        /* Photo grid */
        <div
          style={{
            ...gridStyle,
            border: `2px dashed ${fileOver ? 'rgba(214,209,206,0.7)' : 'transparent'}`,
            borderRadius: 8,
            padding: fileOver ? '0.5rem' : '0',
            transition: 'border-color .12s, padding .12s',
          }}
        >
          {photos.map((row, i) => {
            const pid = getPhotoId(row.photo)
            const doc = pid !== null ? docs[pid] : undefined
            const src = thumbOf(doc)
            const isCover = pid !== null && pid === coverId
            const isDragging = dragIdx === i
            const isOver = overIdx === i && dragIdx !== null && dragIdx !== i
            const isHovered = hoveredIdx === i || focusedIdx === i

            return (
              <div
                key={row.id ?? `${pid}-${i}`}
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragIdx(i) }}
                onDragEnter={() => { if (dragIdx !== null && dragIdx !== i) setOverIdx(i) }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                onDrop={(e) => { e.preventDefault(); move(dragIdx, i); setDragIdx(null); setOverIdx(null) }}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setFocusedIdx(i)}
                onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusedIdx((prev) => (prev === i ? null : prev)) }}
                style={{
                  position: 'relative',
                  borderRadius: 6,
                  overflow: 'hidden',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  border: `2px solid ${isOver ? 'rgba(214,209,206,0.9)' : isCover ? 'rgba(201,162,39,0.6)' : 'rgba(155,154,154,0.15)'}`,
                  opacity: isDragging ? 0.35 : 1,
                  transition: 'opacity .12s, border-color .1s, transform .1s',
                  transform: isOver ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isOver ? '0 0 0 3px rgba(214,209,206,0.2)' : 'none',
                  background: '#1a1a1a',
                  // Explicit height instead of aspectRatio for reliability
                  height: '160px',
                }}
                title={doc?.filename ?? `Photo ${i + 1}`}
              >
                {/* Thumbnail */}
                {src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={doc?.alt ?? doc?.filename ?? ''}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}

                {/* No-thumbnail placeholder */}
                {!src && (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                    <span aria-hidden="true" style={{ fontSize: '1.6rem', opacity: 0.2 }}>&#128247;</span>
                    {doc?.filename && (
                      <span style={{ fontSize: '0.55rem', color: '#9b9a9a', padding: '0 0.5rem', textAlign: 'center', wordBreak: 'break-all', lineHeight: 1.3 }}>{doc.filename}</span>
                    )}
                  </div>
                )}

                {/* Overlay — always visible for position + cover badge; controls show on hover */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: isHovered || isDragging ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.18)',
                    transition: 'background .15s',
                    pointerEvents: 'none',
                  }}
                  aria-hidden="true"
                />

                {/* Position badge */}
                <span style={{
                  position: 'absolute', top: '0.3rem', left: '0.3rem',
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em',
                  background: 'rgba(0,0,0,0.65)', color: '#d6d1ce',
                  padding: '0.15rem 0.35rem', borderRadius: 3,
                }}>
                  {i + 1}
                </span>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); remove(i) }}
                  aria-label="Remove from gallery"
                  style={{
                    position: 'absolute', top: '0.3rem', right: '0.3rem',
                    width: 22, height: 22, borderRadius: '50%',
                    border: 'none', background: 'rgba(0,0,0,0.65)', color: '#fff',
                    fontSize: '0.9rem', lineHeight: 1, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: isHovered ? 1 : 0, transition: 'opacity .15s',
                  }}
                >
                  &times;
                </button>

                {/* Keyboard/screen-reader equivalent of drag-to-reorder */}
                <div style={{
                  position: 'absolute', top: '0.3rem', left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', gap: '0.25rem',
                  opacity: isHovered ? 1 : 0, transition: 'opacity .15s',
                }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); move(i, i - 1) }}
                    disabled={i === 0}
                    aria-label={`Move photo ${i + 1} earlier`}
                    style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: 'none', background: 'rgba(0,0,0,0.65)', color: '#fff',
                      fontSize: '0.7rem', lineHeight: 1, cursor: i === 0 ? 'default' : 'pointer',
                      opacity: i === 0 ? 0.35 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    &#8592;
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); move(i, i + 1) }}
                    disabled={i === photos.length - 1}
                    aria-label={`Move photo ${i + 1} later`}
                    style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: 'none', background: 'rgba(0,0,0,0.65)', color: '#fff',
                      fontSize: '0.7rem', lineHeight: 1, cursor: i === photos.length - 1 ? 'default' : 'pointer',
                      opacity: i === photos.length - 1 ? 0.35 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    &#8594;
                  </button>
                </div>

                {/* Bottom: cover indicator or set-cover button */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0.3rem 0.5rem',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  opacity: (isHovered || isCover) ? 1 : 0,
                  transition: 'opacity .15s',
                }}>
                  {isCover ? (
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(201,162,39,0.95)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      <span aria-hidden="true">★ </span>Cover photo
                    </span>
                  ) : pid !== null ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCover(pid) }}
                      aria-label={`Set photo ${i + 1} as gallery cover`}
                      style={{
                        fontSize: '0.62rem', color: '#d6d1ce', background: 'none',
                        border: '1px solid rgba(214,209,206,0.4)', borderRadius: 3,
                        padding: '0.15rem 0.4rem', cursor: 'pointer',
                      }}
                    >
                      Set as cover
                    </button>
                  ) : null}
                </div>

                {/* Drag grip indicator */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'grid', gridTemplateColumns: 'repeat(3, 4px)', gap: '3px',
                    opacity: isHovered && !isDragging ? 0.6 : 0,
                    transition: 'opacity .15s', pointerEvents: 'none',
                  }}
                >
                  {Array.from({ length: 9 }).map((_, d) => (
                    <div key={d} style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff' }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}
