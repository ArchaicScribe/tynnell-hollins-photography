'use client'
import { useField } from '@payloadcms/ui'
import { useEffect, useMemo, useState } from 'react'

// Visual gallery arranger (TYN-234). Replaces the default vertical array-row UI
// for a gallery's photos with a Pixieset-style grid of large thumbnails:
// drag to reorder, remove, and set the cover photo right from the grid. Reads
// and writes the same `photos` form path via useField, so the existing "Add
// Multiple Photos" button (which appends rows) stays fully compatible. Adding
// is left to that button; this component owns arrange + remove + set cover.
// 'use client' + inline styles for resilience, matching the rest of the admin.
type PhotoRow = { id?: string; photo: number | null }
type PhotoDoc = {
  id: number
  url?: string | null
  filename?: string | null
  alt?: string | null
  sizes?: { thumbnail?: { url?: string | null }; card?: { url?: string | null } } | null
}

function thumbOf(p: PhotoDoc | undefined): string | null {
  if (!p) return null
  return p.sizes?.thumbnail?.url ?? p.sizes?.card?.url ?? p.url ?? null
}

export function GalleryPhotoArranger() {
  const { value: rawPhotos, setValue: setPhotos } = useField<PhotoRow[]>({ path: 'photos' })
  const { value: rawCover, setValue: setCover } = useField<number | { id?: number } | null>({ path: 'coverPhoto' })

  // On a brand-new (unsaved) gallery Payload reports an array field's value as
  // its row count (the number 0), not an array. Guard with Array.isArray.
  const photos: PhotoRow[] = Array.isArray(rawPhotos) ? rawPhotos : []
  const coverId = typeof rawCover === 'object' && rawCover !== null ? rawCover.id ?? null : (rawCover as number | null)

  const [docs, setDocs] = useState<Record<number, PhotoDoc>>({})
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

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
      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9b9a9a', fontSize: '0.85rem', border: '1px dashed rgba(155,154,154,0.25)', borderRadius: 6 }}>
        No photos in this gallery yet. Use <strong>+ Add Multiple Photos</strong> above to add some, then drag them here to set the order.
      </div>
    ),
    [],
  )

  return (
    <div style={{ paddingTop: '0.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#b8b4b1', letterSpacing: '0.03em' }}>
          Photos in this gallery
        </span>
        <span style={{ fontSize: '0.72rem', color: '#6b6a6a' }}>
          {count > 0 ? `${count} photo${count !== 1 ? 's' : ''} · drag to reorder · order here = order on the site` : ''}
        </span>
      </div>

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
                onDragEnter={() => setOverIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
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
