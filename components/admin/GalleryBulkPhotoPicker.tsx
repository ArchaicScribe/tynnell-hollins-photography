'use client'
import { useField } from '@payloadcms/ui'
import { useState, useCallback, useEffect, useRef } from 'react'

type PhotoRow = { id?: string; photo: number | null }
type PhotoDoc = {
  id: number
  url?: string | null
  filename?: string | null
  alt?: string | null
  category?: string | null
  sizes?: { thumbnail?: { url?: string | null } | null; card?: { url?: string | null } | null } | null
}

function thumbUrl(p: PhotoDoc): string | null {
  return p.sizes?.thumbnail?.url ?? p.sizes?.card?.url ?? p.url ?? null
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

const PAGE_SIZE = 48

export function GalleryBulkPhotoPicker() {
  const { value: rawPhotos, setValue: setPhotos } = useField<PhotoRow[]>({ path: 'photos' })
  // On a brand-new (unsaved) gallery, Payload reports an array field's value as
  // its row count (the number 0), not an empty array. Guard with Array.isArray.
  const photos: PhotoRow[] = Array.isArray(rawPhotos) ? rawPhotos : []

  const [open, setOpen] = useState(false)
  const [pagePhotos, setPagePhotos] = useState<PhotoDoc[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasOpenRef = useRef(false)

  // IDs already in this gallery
  const currentIds = new Set(
    photos.map(r => (typeof r.photo === 'number' ? r.photo : null)).filter((v): v is number => v !== null),
  )

  const fetchPhotos = useCallback((cat: string, q: string, pg: number) => {
    setLoading(true)
    setLoadError('')
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(pg), depth: '1', sort: '-createdAt' })
    if (cat !== 'all') params.append('where[category][equals]', cat)
    if (q) params.append('where[filename][contains]', q)
    fetch(`/api/photos?${params.toString()}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then((data: { docs?: PhotoDoc[]; totalDocs?: number; totalPages?: number }) => {
        setPagePhotos(data.docs ?? [])
        setTotal(data.totalDocs ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setLoading(false)
      })
      .catch(() => {
        setLoadError("Couldn't load photos. Check your connection and try again.")
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!open) return
    fetchPhotos(catFilter, debouncedSearch, page)
  }, [open, catFilter, debouncedSearch, page, fetchPhotos])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const openPicker = useCallback(() => {
    setSelected(new Set())
    setCatFilter('all')
    setSearch('')
    setDebouncedSearch('')
    setPage(1)
    setOpen(true)
  }, [])

  const changeCategory = (cat: string) => {
    setCatFilter(cat)
    setPage(1)
  }

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

  useEffect(() => {
    // The trigger button unmounts while the modal is open (see the `!open`
    // early return below), so its ref is only live again after this closing
    // render commits - focus it here rather than at each setOpen(false) call site.
    if (wasOpenRef.current && !open) triggerRef.current?.focus()
    wasOpenRef.current = open
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

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
        <button ref={triggerRef} type="button" onClick={openPicker} style={{ ...btnBase, background: 'rgba(155,154,154,0.08)' }}>
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
                color: selected.size > 0 ? '#d6d1ce' : '#9b9a9a',
                cursor: selected.size > 0 ? 'pointer' : 'default',
                fontWeight: selected.size > 0 ? 500 : 400,
              }}
            >
              {selected.size > 0 ? `Add ${selected.size} Photo${selected.size !== 1 ? 's' : ''}` : 'Add Photos'}
            </button>
          </div>
        </div>

        {/* Search + category filter */}
        <div
          style={{
            padding: '0.55rem 1.25rem',
            borderBottom: '1px solid rgba(155,154,154,0.08)',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
          }}
        >
          <input
            type="search"
            placeholder="Search by filename..."
            aria-label="Search photos by filename"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.4rem 0.7rem',
              background: '#262626',
              border: '1px solid rgba(155,154,154,0.2)',
              borderRadius: '4px',
              color: '#d6d1ce',
              fontSize: '0.82rem',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => changeCategory(cat)}
                aria-pressed={catFilter === cat}
                style={{
                  padding: '0.18rem 0.6rem',
                  background: catFilter === cat ? 'rgba(155,154,154,0.18)' : 'transparent',
                  border: `1px solid ${catFilter === cat ? 'rgba(155,154,154,0.35)' : 'rgba(155,154,154,0.15)'}`,
                  borderRadius: '3px',
                  color: catFilter === cat ? '#d6d1ce' : '#9b9a9a',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  fontFamily: 'inherit',
                  textTransform: 'capitalize',
                }}
              >
                {CAT_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Photo grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 1.25rem' }}>
          {loadError ? (
            <div role="alert" style={{ textAlign: 'center', padding: '3rem', color: '#f0a3a3', fontSize: '0.85rem' }}>
              {loadError}
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9b9a9a', fontSize: '0.85rem' }}>
              Loading...
            </div>
          ) : pagePhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9b9a9a', fontSize: '0.85rem' }}>
              No photos found.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '0.45rem',
              }}
            >
              {pagePhotos.map(photo => {
                const inGallery = currentIds.has(photo.id)
                const isSelected = selected.has(photo.id)
                const src = thumbUrl(photo)
                return (
                  <div
                    key={photo.id}
                    role="button"
                    tabIndex={inGallery ? -1 : 0}
                    aria-label={photo.alt ?? photo.filename ?? 'Photo'}
                    aria-pressed={isSelected}
                    aria-disabled={inGallery}
                    onClick={() => toggle(photo.id)}
                    onKeyDown={(e) => { if (!inGallery && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(photo.id) } }}
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
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
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
                        <span style={{ color: '#0c0c0c', fontSize: '0.6rem', fontWeight: 700, lineHeight: 1 }} aria-hidden="true">
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

        {/* Footer: count + pagination + clear */}
        <div
          style={{
            padding: '0.55rem 1.25rem',
            borderTop: '1px solid rgba(155,154,154,0.08)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'rgba(155,154,154,0.6)' }}>
            {total} photo{total !== 1 ? 's' : ''}
            {catFilter !== 'all' ? ` in ${CAT_LABELS[catFilter]}` : ''}
            {currentIds.size > 0 ? ` · ${currentIds.size} already in gallery` : ''}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                style={{ background: 'transparent', border: 'none', color: 'rgba(155,154,154,0.6)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Clear selection
              </button>
            )}
            {totalPages > 1 && (
              <>
                <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  style={{ padding: '0.3rem 0.65rem', background: 'transparent', border: '1px solid rgba(155,154,154,0.25)', borderRadius: '3px', color: page === 1 ? 'rgba(155,154,154,0.3)' : '#9b9a9a', fontSize: '0.72rem', cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                  Prev
                </button>
                <span style={{ fontSize: '0.72rem', color: '#9b9a9a' }}>{page} / {totalPages}</span>
                <button type="button" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                  style={{ padding: '0.3rem 0.65rem', background: 'transparent', border: '1px solid rgba(155,154,154,0.25)', borderRadius: '3px', color: page === totalPages ? 'rgba(155,154,154,0.3)' : '#9b9a9a', fontSize: '0.72rem', cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                  Next
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
