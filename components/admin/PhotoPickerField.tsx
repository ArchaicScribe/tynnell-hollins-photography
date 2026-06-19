'use client'
import { useField } from '@payloadcms/ui'
import { useState, useCallback, useEffect, useRef } from 'react'

type PhotoDoc = {
  id: number
  url?: string | null
  filename?: string | null
  alt?: string | null
  category?: string | null
  sizes?: { thumbnail?: { url?: string | null } | null; card?: { url?: string | null } | null } | null
}

type RelValue = PhotoDoc | number | null | undefined

function toPhotoDoc(v: RelValue): PhotoDoc | null {
  if (!v) return null
  if (typeof v === 'number') return { id: v }
  return v as PhotoDoc
}

function thumbUrl(p: PhotoDoc): string | null {
  return p.sizes?.thumbnail?.url ?? p.sizes?.card?.url ?? p.url ?? null
}

const CATEGORIES = ['all', 'weddings', 'portraits', 'families', 'couples', 'brands']
const CAT_LABELS: Record<string, string> = {
  all: 'All', weddings: 'Weddings', portraits: 'Portraits',
  families: 'Families', couples: 'Couples', brands: 'Brands',
}
const PAGE_SIZE = 48

const pageBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '0.3rem 0.65rem',
  background: 'transparent',
  border: '1px solid rgba(155,154,154,0.25)',
  borderRadius: '3px',
  color: disabled ? 'rgba(155,154,154,0.3)' : '#9b9a9a',
  fontSize: '0.72rem',
  cursor: disabled ? 'default' : 'pointer',
  fontFamily: 'inherit',
})

export function PhotoPickerField({
  fieldPath,
  label,
  hint,
  required = false,
}: {
  fieldPath: string
  label: string
  hint?: string
  required?: boolean
}) {
  const { value: rawValue, setValue } = useField<RelValue>({ path: fieldPath })
  const current = toPhotoDoc(rawValue)

  const [open, setOpen] = useState(false)
  const [photos, setPhotos] = useState<PhotoDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [catFilter, setCatFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const headingId = `photo-picker-heading-${fieldPath}`

  const fetchPhotos = useCallback((cat: string, q: string, pg: number) => {
    setLoading(true)
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(pg), depth: '1', sort: '-createdAt' })
    if (cat !== 'all') params.append('where[category][equals]', cat)
    if (q) params.append('where[filename][contains]', q)
    fetch(`/api/photos?${params.toString()}`, { credentials: 'include' })
      .then(r => r.json())
      .then((data: { docs?: PhotoDoc[]; totalDocs?: number; totalPages?: number }) => {
        setPhotos(data.docs ?? [])
        setTotal(data.totalDocs ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!open) return
    fetchPhotos(catFilter, debouncedSearch, page)
  }, [open, catFilter, debouncedSearch, page, fetchPhotos])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const openPicker = useCallback(() => {
    setCatFilter('all'); setSearch(''); setDebouncedSearch(''); setPage(1); setOpen(true)
  }, [])

  const selectPhoto = (photo: PhotoDoc) => { setValue(photo); setOpen(false) }
  const changeCategory = (cat: string) => { setCatFilter(cat); setPage(1) }

  const btnStyle: React.CSSProperties = {
    cursor: 'pointer',
    fontFamily: 'var(--font-body, inherit)',
    fontSize: '0.75rem',
    borderRadius: '4px',
    border: '1px solid rgba(155,154,154,0.25)',
    background: 'rgba(155,154,154,0.08)',
    color: 'var(--theme-text, #e6e1de)',
    padding: '0.38rem 0.8rem',
    letterSpacing: '0.02em',
  }

  return (
    <div style={{ fontFamily: 'var(--font-body, system-ui)', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Archivo, sans-serif', color: 'var(--theme-text, #d6d1ce)', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>
        {label}
        {required && <span style={{ color: '#f87171', marginLeft: '2px' }}>*</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{ width: '96px', height: '72px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(155,154,154,0.08)', border: '1px solid rgba(155,154,154,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {current?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt={current.alt ?? current.filename ?? label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <span style={{ fontSize: '1.5rem', color: 'rgba(155,154,154,0.35)' }}>&#128247;</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <button type="button" onClick={openPicker} style={btnStyle}>
            {current ? `Change ${label}` : `Choose ${label}`}
          </button>
          {current?.filename && (
            <span style={{ fontSize: '0.65rem', color: 'rgba(155,154,154,0.6)', fontFamily: 'Roboto Mono, monospace' }}>
              {current.filename}
            </span>
          )}
          {!current && hint && (
            <span style={{ fontSize: '0.65rem', color: 'rgba(155,154,154,0.5)' }}>{hint}</span>
          )}
        </div>
      </div>

      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby={headingId} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1a1a', border: '1px solid rgba(155,154,154,0.15)', borderRadius: '6px', width: 'min(92vw, 1100px)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.25rem', borderBottom: '1px solid rgba(155,154,154,0.12)', flexShrink: 0 }}>
              <span id={headingId} style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.95rem', fontWeight: 600, color: '#d6d1ce' }}>
                Choose {label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#9b9a9a' }}>Click a photo to select it</span>
                <button type="button" onClick={() => setOpen(false)} style={{ cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid rgba(155,154,154,0.25)', background: 'transparent', color: '#9b9a9a', padding: '0.38rem 0.8rem' }}>
                  Cancel
                </button>
              </div>
            </div>

            {/* Search + category filter */}
            <div style={{ padding: '0.55rem 1.25rem', borderBottom: '1px solid rgba(155,154,154,0.08)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <input
                type="search"
                placeholder="Search by filename..."
                aria-label="Search photos by filename"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.7rem', background: '#262626', border: '1px solid rgba(155,154,154,0.2)', borderRadius: '4px', color: '#d6d1ce', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => changeCategory(cat)} aria-pressed={catFilter === cat}
                    style={{ padding: '0.18rem 0.6rem', background: catFilter === cat ? 'rgba(155,154,154,0.18)' : 'transparent', border: `1px solid ${catFilter === cat ? 'rgba(155,154,154,0.35)' : 'rgba(155,154,154,0.15)'}`, borderRadius: '3px', color: catFilter === cat ? '#d6d1ce' : '#9b9a9a', fontSize: '0.7rem', cursor: 'pointer', letterSpacing: '0.04em', fontFamily: 'inherit', textTransform: 'capitalize' }}>
                    {CAT_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 1.25rem' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9b9a9a', fontSize: '0.85rem' }}>Loading...</div>
              ) : photos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9b9a9a', fontSize: '0.85rem' }}>No photos found.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.45rem' }}>
                  {photos.map(photo => {
                    const isSelected = current?.id === photo.id
                    const src = thumbUrl(photo)
                    return (
                      <div key={photo.id} role="button" tabIndex={0}
                        aria-label={photo.alt ?? photo.filename ?? 'Photo'}
                        aria-pressed={isSelected}
                        onClick={() => selectPhoto(photo)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPhoto(photo) } }}
                        style={{ position: 'relative', aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${isSelected ? 'rgba(214,209,206,0.8)' : 'transparent'}`, boxSizing: 'border-box' }}>
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt={photo.alt ?? photo.filename ?? ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#555', fontSize: '0.6rem' }}>No preview</span>
                          </div>
                        )}
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '0.28rem', right: '0.28rem', width: '18px', height: '18px', background: '#d6d1ce', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#0c0c0c', fontSize: '0.6rem', fontWeight: 700, lineHeight: 1 }} aria-hidden="true">&#10003;</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '0.55rem 1.25rem', borderTop: '1px solid rgba(155,154,154,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', color: 'rgba(155,154,154,0.5)' }}>
                {total} photo{total !== 1 ? 's' : ''}{catFilter !== 'all' ? ` in ${CAT_LABELS[catFilter]}` : ''}
              </span>
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={pageBtnStyle(page === 1)}>Prev</button>
                  <span style={{ fontSize: '0.72rem', color: '#9b9a9a' }}>{page} / {totalPages}</span>
                  <button type="button" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={pageBtnStyle(page === totalPages)}>Next</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
