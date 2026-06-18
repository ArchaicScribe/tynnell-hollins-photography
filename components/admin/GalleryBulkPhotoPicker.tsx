'use client'
import { useField } from '@payloadcms/ui'
import { useState, useCallback } from 'react'

type PhotoRow = { id?: string; photo: number | null }
type PhotoDoc = {
  id: number
  url?: string | null
  filename?: string | null
  alt?: string | null
  category?: string | null
}

const CATEGORIES = ['all', 'weddings', 'portraits', 'families', 'couples', 'brands']
const CAT_LABELS: Record<string, string> = {
  all: 'All',
  weddings: 'Weddings',
  portraits: 'Portraits',
  families: 'Families',
  couples: 'Couples',
  brands: 'Brands',
}

export function GalleryBulkPhotoPicker() {
  const { value: rawPhotos, setValue: setPhotos } = useField<PhotoRow[]>({ path: 'photos' })
  // On a brand-new (unsaved) gallery, Payload reports an array field's value as
  // its row count (the number 0), not an empty array. `?? []` does not catch 0,
  // so guard with Array.isArray to avoid `photos.map is not a function` on the
  // Create page. On a saved gallery the value is the real array of rows.
  const photos: PhotoRow[] = Array.isArray(rawPhotos) ? rawPhotos : []

  const [open, setOpen] = useState(false)
  const [allPhotos, setAllPhotos] = useState<PhotoDoc[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [catFilter, setCatFilter] = useState('all')

  // IDs already in this gallery
  const currentIds = new Set(
    photos.map(r => (typeof r.photo === 'number' ? r.photo : null)).filter((v): v is number => v !== null),
  )

  const openPicker = useCallback(() => {
    setSelected(new Set())
    setCatFilter('all')
    setLoading(true)
    setOpen(true)
    fetch('/api/photos?limit=500&depth=0', { credentials: 'include' })
      .then(r => r.json())
      .then((data: { docs?: PhotoDoc[] }) => {
        setAllPhotos(data.docs ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggle = (id: number) => {
    if (currentIds.has(id)) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addSelected = () => {
    const newRows: PhotoRow[] = [...selected].map(id => ({
      id: crypto.randomUUID(),
      photo: id,
    }))
    setPhotos([...photos, ...newRows])
    setOpen(false)
  }

  const filtered = catFilter === 'all' ? allPhotos : allPhotos.filter(p => p.category === catFilter)

  const btnBase: React.CSSProperties = {
    cursor: 'pointer',
    fontFamily: 'var(--font-body, inherit)',
    fontSize: '0.78rem',
    letterSpacing: '0.02em',
    borderRadius: '4px',
    border: '1px solid rgba(155,154,154,0.25)',
    background: 'transparent',
    color: 'var(--theme-text, #e6e1de)',
    padding: '0.4rem 0.85rem',
  }

  if (!open) {
    return (
      <div style={{ paddingBottom: '0.25rem' }}>
        <button type="button" onClick={openPicker} style={{ ...btnBase, background: 'rgba(155,154,154,0.08)' }}>
          + Add Multiple Photos
        </button>
      </div>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-picker-heading"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid rgba(155,154,154,0.15)',
          borderRadius: '6px',
          width: 'min(92vw, 1100px)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.25rem',
            borderBottom: '1px solid rgba(155,154,154,0.12)',
            flexShrink: 0,
          }}
        >
          <span
            id="bulk-picker-heading"
            style={{
              fontFamily: 'var(--font-heading, Archivo, sans-serif)',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#d6d1ce',
            }}
          >
            Add Photos to Gallery
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#9b9a9a' }}>
              {selected.size > 0 ? `${selected.size} selected` : 'Click photos to select'}
            </span>
            <button type="button" onClick={() => setOpen(false)} style={{ ...btnBase, color: '#9b9a9a' }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={addSelected}
              disabled={selected.size === 0}
              style={{
                ...btnBase,
                background: selected.size > 0 ? 'rgba(155,154,154,0.18)' : 'transparent',
                border: `1px solid ${selected.size > 0 ? 'rgba(155,154,154,0.35)' : 'rgba(155,154,154,0.12)'}`,
                color: selected.size > 0 ? '#d6d1ce' : 'rgba(155,154,154,0.35)',
                cursor: selected.size > 0 ? 'pointer' : 'default',
                fontWeight: selected.size > 0 ? 500 : 400,
              }}
            >
              {selected.size > 0 ? `Add ${selected.size} Photo${selected.size !== 1 ? 's' : ''}` : 'Add Photos'}
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            padding: '0.55rem 1.25rem',
            borderBottom: '1px solid rgba(155,154,154,0.08)',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCatFilter(cat)}
              style={{
                padding: '0.18rem 0.6rem',
                background: catFilter === cat ? 'rgba(155,154,154,0.18)' : 'transparent',
                border: `1px solid ${catFilter === cat ? 'rgba(155,154,154,0.35)' : 'rgba(155,154,154,0.15)'}`,
                borderRadius: '3px',
                color: catFilter === cat ? '#d6d1ce' : '#9b9a9a',
                fontSize: '0.7rem',
                cursor: 'pointer',
                letterSpacing: '0.04em',
                fontFamily: 'var(--font-body, inherit)',
                textTransform: 'capitalize',
              }}
            >
              {CAT_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Photo grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 1.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9b9a9a', fontSize: '0.85rem' }}>
              Loading photos...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9b9a9a', fontSize: '0.85rem' }}>
              No photos in this category.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '0.45rem',
              }}
            >
              {filtered.map(photo => {
                const inGallery = currentIds.has(photo.id)
                const isSelected = selected.has(photo.id)
                return (
                  <div
                    key={photo.id}
                    onClick={() => toggle(photo.id)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      cursor: inGallery ? 'default' : 'pointer',
                      border: `2px solid ${isSelected ? 'rgba(214,209,206,0.7)' : 'transparent'}`,
                      opacity: inGallery ? 0.4 : 1,
                      boxSizing: 'border-box',
                    }}
                  >
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={photo.alt ?? photo.filename ?? ''}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: '#2a2a2a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ color: '#555', fontSize: '0.6rem' }}>No preview</span>
                      </div>
                    )}

                    {/* Already added overlay */}
                    {inGallery && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0,0,0,0.35)',
                        }}
                      >
                        <span
                          style={{
                            color: '#9b9a9a',
                            fontSize: '0.6rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            background: 'rgba(0,0,0,0.55)',
                            padding: '0.12rem 0.3rem',
                            borderRadius: '2px',
                          }}
                        >
                          Added
                        </span>
                      </div>
                    )}

                    {/* Selection checkmark */}
                    {isSelected && !inGallery && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '0.28rem',
                          right: '0.28rem',
                          width: '18px',
                          height: '18px',
                          background: '#d6d1ce',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ color: '#0c0c0c', fontSize: '0.6rem', fontWeight: 700, lineHeight: 1 }}>
                          ✓
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer count */}
        <div
          style={{
            padding: '0.55rem 1.25rem',
            borderTop: '1px solid rgba(155,154,154,0.08)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'rgba(155,154,154,0.6)' }}>
            {filtered.length} photo{filtered.length !== 1 ? 's' : ''}
            {catFilter !== 'all' ? ` in ${CAT_LABELS[catFilter]}` : ' total'}
            {currentIds.size > 0 ? ` · ${currentIds.size} already in gallery` : ''}
          </span>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(155,154,154,0.6)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-body, inherit)',
              }}
            >
              Clear selection
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
