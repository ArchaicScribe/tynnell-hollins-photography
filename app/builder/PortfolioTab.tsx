'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const ui = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const teal = '#0d9488'

const CATEGORIES = ['weddings', 'portraits', 'families', 'couples', 'brands'] as const

export interface GalleryCard {
  id: number
  title: string
  slug: string | null
  category: string | null
  status: string
  photoCount: number
  coverThumb: string | null
  updatedAt: string | null
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDown({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" aria-hidden="true" style={{ opacity: 0.55 }}>
      <path d="M2 4L5.5 7.5L9 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Filter dropdown
// ---------------------------------------------------------------------------

function FilterDropdown({ label, value, options, onChange }: {
  label: string
  value: string | null
  options: { label: string; value: string | null }[]
  onChange: (v: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const activeLabel = options.find(o => o.value === value)?.label ?? label
  const isActive = value !== null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.38rem 0.8rem',
          background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
          border: `1px solid ${isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.13)'}`,
          borderRadius: 6, color: isActive ? '#e6e1de' : '#9b9a9a',
          fontSize: '0.8rem', fontFamily: ui, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        {activeLabel}
        <ChevronDown />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
          background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, padding: '0.35rem', minWidth: 160,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {options.map(opt => (
            <button
              key={String(opt.value)} type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                width: '100%', padding: '0.45rem 0.65rem',
                background: value === opt.value ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none', borderRadius: 5,
                color: value === opt.value ? '#e6e1de' : '#9b9a9a',
                fontSize: '0.8rem', fontFamily: ui, textAlign: 'left', cursor: 'pointer',
              }}
              onMouseEnter={e => { if (value !== opt.value) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (value !== opt.value) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {opt.value !== null && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: opt.value === 'published' ? '#4ade80' : '#6b6663' }} />
              )}
              {opt.label}
              {value === opt.value && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>&#10003;</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// New collection modal
// ---------------------------------------------------------------------------

function NewCollectionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>('portraits')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const create = async () => {
    if (!title.trim()) return
    setCreating(true); setError('')
    try {
      const res = await fetch('/api/galleries', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), category, status: 'draft' }),
      })
      if (res.ok) {
        const data = await res.json() as { doc?: { id: number } }
        const id = data.doc?.id
        if (id) {
          onCreated()
          window.location.href = `/gallery-editor/${id}`
        } else {
          onClose()
        }
      } else {
        setError('Could not create collection. Please try again.')
        setCreating(false)
      }
    } catch { setError('Connection error.'); setCreating(false) }
  }

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="new-col-label"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={e => { if (e.key === 'Escape') onClose() }}
    >
      <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '1.75rem', width: 380, display: 'flex', flexDirection: 'column', gap: '1.1rem', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
        <h2 id="new-col-label" style={{ margin: 0, fontFamily: ui, fontSize: '1rem', fontWeight: 600, color: '#e6e1de' }}>New collection</h2>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontFamily: ui, fontSize: '0.72rem', fontWeight: 500, color: '#9b9a9a' }}>Collection name</span>
          <input
            autoFocus type="text" value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void create() }}
            placeholder="e.g. Smith Wedding"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '0.6rem 0.75rem', color: '#e6e1de', fontSize: '0.88rem', outline: 'none', fontFamily: ui }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontFamily: ui, fontSize: '0.72rem', fontWeight: 500, color: '#9b9a9a' }}>Category</span>
          <select
            value={category} onChange={e => setCategory(e.target.value)}
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '0.6rem 0.75rem', color: '#e6e1de', fontSize: '0.85rem', outline: 'none', fontFamily: ui, cursor: 'pointer' }}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </label>
        {error && <p role="alert" style={{ margin: 0, fontFamily: ui, fontSize: '0.75rem', color: '#f87171' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#9b9a9a', borderRadius: 7, padding: '0.5rem 1rem', fontSize: '0.82rem', fontFamily: ui, cursor: 'pointer' }}>Cancel</button>
          <button
            type="button" onClick={() => void create()} disabled={!title.trim() || creating} aria-busy={creating}
            style={{ background: teal, border: 'none', color: '#fff', borderRadius: 7, padding: '0.5rem 1.2rem', fontSize: '0.82rem', fontWeight: 600, fontFamily: ui, cursor: !title.trim() || creating ? 'not-allowed' : 'pointer', opacity: !title.trim() || creating ? 0.5 : 1 }}
          >
            {creating ? 'Creating...' : 'Create collection'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main tab component
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapeGallery(g: any): GalleryCard {
  return {
    id: g.id,
    title: g.title,
    slug: typeof g.slug === 'string' ? g.slug : null,
    category: g.category ?? null,
    status: g.status ?? 'published',
    photoCount: Array.isArray(g.photos) ? g.photos.length : 0,
    coverThumb: g.coverPhoto?.sizes?.card?.url ?? g.coverPhoto?.url ?? null,
    updatedAt: typeof g.updatedAt === 'string' ? g.updatedAt : null,
  }
}

export function PortfolioTab({ initialGalleries = [] }: { initialGalleries?: GalleryCard[] }) {
  const [galleries, setGalleries] = useState<GalleryCard[]>(initialGalleries)
  const [loading, setLoading] = useState(initialGalleries.length === 0)
  const [showModal, setShowModal] = useState(false)
  const [filterCat, setFilterCat] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [reordering, setReordering] = useState(false)
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchGalleries = useCallback(() => {
    fetch('/api/galleries?limit=200&depth=1&sort=displayOrder', { credentials: 'include' })
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((d: { docs?: any[] }) => {
        if (d.docs) setGalleries(d.docs.map(shapeGallery))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (initialGalleries.length === 0) fetchGalleries()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openModal = useCallback(() => setShowModal(true), [])

  const moveGallery = (from: number, to: number) => {
    if (from === to) return
    const next = [...galleries]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setGalleries(next)
    if (reorderTimer.current) clearTimeout(reorderTimer.current)
    reorderTimer.current = setTimeout(async () => {
      setReordering(true)
      await Promise.all(next.map((g, i) =>
        fetch(`/api/galleries/${g.id}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: (i + 1) * 10 }),
        })
      ))
      setReordering(false)
    }, 800)
  }

  const isFiltered = !!(filterCat || filterStatus || search.trim())
  const filtered = galleries.filter(g =>
    (!filterCat || g.category === filterCat) &&
    (!filterStatus || (filterStatus === 'published' ? g.status !== 'draft' : g.status === 'draft')) &&
    (!search.trim() || g.title.toLowerCase().includes(search.trim().toLowerCase()))
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {showModal && <NewCollectionModal onClose={() => setShowModal(false)} onCreated={fetchGalleries} />}

      {/* Header bar */}
      <div style={{ height: 60, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', padding: '0 1.75rem', flexShrink: 0, gap: '1rem' }}>
        <h1 style={{ margin: 0, fontFamily: ui, fontSize: '1.25rem', fontWeight: 700, color: '#d6d1ce', letterSpacing: '-0.02em', flexShrink: 0 }}>Collections</h1>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 300, marginLeft: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#5a5a5a', display: 'flex', alignItems: 'center' }}>
              <SearchIcon />
            </span>
            <input
              type="search" placeholder="Search..." aria-label="Search collections"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.75rem 0.4rem 2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#d6d1ce', fontSize: '0.83rem', fontFamily: ui, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/admin/collections/photos"
            style={{ padding: '0.42rem 0.9rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#9b9a9a', fontSize: '0.82rem', fontFamily: ui, textDecoration: 'none', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.28)'; (e.currentTarget as HTMLElement).style.color = '#d6d1ce' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
          >
            Photo Library
          </a>
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
            <button
              type="button" onClick={openModal}
              style={{ padding: '0.42rem 1rem', background: teal, border: 'none', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: ui, whiteSpace: 'nowrap' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none' }}
            >
              New Collection
            </button>
            <button
              type="button" aria-label="More collection options"
              style={{ padding: '0.42rem 0.5rem', background: '#0b8078', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ChevronDown size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '0.55rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', flexShrink: 0 }}>
        <FilterDropdown
          label="Status" value={filterStatus} onChange={setFilterStatus}
          options={[
            { label: 'Status', value: null },
            { label: 'Published', value: 'published' },
            { label: 'Draft', value: 'draft' },
          ]}
        />
        <FilterDropdown
          label="Category" value={filterCat} onChange={setFilterCat}
          options={[
            { label: 'Category', value: null },
            ...CATEGORIES.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
          ]}
        />
        {isFiltered && (
          <button
            type="button" onClick={() => { setFilterCat(null); setFilterStatus(null); setSearch('') }}
            style={{ padding: '0.32rem 0.65rem', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#6b6663', fontSize: '0.72rem', fontFamily: ui, cursor: 'pointer' }}
          >
            Clear
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#3a3a3a', fontFamily: ui }}>
          {loading
            ? <span>Loading...</span>
            : reordering
              ? <span style={{ color: '#4a4a4a' }}>Saving order...</span>
              : filtered.length === galleries.length
                ? `${galleries.length} collection${galleries.length !== 1 ? 's' : ''}`
                : `${filtered.length} of ${galleries.length}`
          }
        </div>
      </div>

      {/* Gallery grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '5rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: teal, animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {!isFiltered && galleries.length > 1 && (
              <p style={{ margin: '0 0 1.1rem', fontSize: '0.72rem', color: '#2a2a2a', fontFamily: ui }}>Drag to reorder</p>
            )}

            {galleries.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: '5rem' }}>
                <div style={{ fontSize: '3rem', opacity: 0.05, marginBottom: '1.25rem' }} aria-hidden="true">&#128444;</div>
                <p style={{ fontFamily: ui, fontSize: '1rem', fontWeight: 500, color: '#4b4b4b', margin: '0 0 1.5rem' }}>No collections yet</p>
                <button type="button" onClick={openModal} style={{ background: teal, border: 'none', color: '#fff', borderRadius: 7, padding: '0.6rem 1.4rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: ui }}>
                  Create your first collection
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#4b4b4b', fontFamily: ui, fontSize: '0.9rem' }}>
                No collections match your filters.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.1rem' }}>
                {filtered.map(g => {
                  const realIdx = galleries.indexOf(g)
                  const isDragging = dragIdx === realIdx
                  const isOver = overIdx === realIdx && dragIdx !== null && dragIdx !== realIdx
                  const isPublished = g.status !== 'draft'
                  return (
                    // eslint-disable-next-line @next/next/no-html-link-for-pages
                    <a
                      key={g.id}
                      href={`/gallery-editor/${g.id}`}
                      draggable={!isFiltered}
                      onDragStart={e => { if (isFiltered) { e.preventDefault(); return }; e.dataTransfer.effectAllowed = 'move'; setDragIdx(realIdx) }}
                      onDragEnter={() => { if (!isFiltered && dragIdx !== null && dragIdx !== realIdx) setOverIdx(realIdx) }}
                      onDragOver={e => { if (!isFiltered) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' } }}
                      onDrop={e => { if (!isFiltered && dragIdx !== null) { e.preventDefault(); moveGallery(dragIdx, realIdx); setDragIdx(null); setOverIdx(null) } }}
                      onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                      style={{
                        textDecoration: 'none', display: 'block', borderRadius: 10, overflow: 'hidden',
                        background: '#141414',
                        border: `1px solid ${isOver ? 'rgba(13,148,136,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        opacity: isDragging ? 0.35 : 1,
                        cursor: !isFiltered ? 'grab' : 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transition: 'border-color 0.15s, transform 0.15s, opacity 0.12s, box-shadow 0.15s',
                      }}
                      onMouseEnter={e => { if (!isDragging) { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)'; el.style.borderColor = 'rgba(255,255,255,0.14)' } }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'; el.style.borderColor = isOver ? 'rgba(13,148,136,0.4)' : 'rgba(255,255,255,0.07)' }}
                    >
                      {/* Cover image */}
                      <div style={{ aspectRatio: '4/3', background: '#1c1c1c', overflow: 'hidden', position: 'relative' }}>
                        {g.coverThumb
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={g.coverThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #141414 100%)' }}>
                              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" style={{ opacity: 0.1 }}>
                                <rect x="2" y="7" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
                                <circle cx="12" cy="15" r="3" stroke="currentColor" strokeWidth="2" />
                                <path d="M2 22l7-6 5 5 6-7 12 9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )
                        }
                      </div>

                      {/* Footer */}
                      <div style={{ padding: '0.8rem 1rem 0.85rem' }}>
                        <p style={{ margin: '0 0 0.25rem', fontFamily: ui, fontSize: '0.9rem', fontWeight: 600, color: '#e6e1de', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {g.title}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.73rem', color: '#6b6663', fontFamily: ui }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: isPublished ? '#4ade80' : 'transparent', border: isPublished ? 'none' : '1.5px solid #4a4a4a' }} />
                          <span>{isPublished ? 'Live' : 'Draft'}</span>
                          <span style={{ opacity: 0.35 }}>&#8226;</span>
                          <span>{g.photoCount} {g.photoCount === 1 ? 'photo' : 'photos'}</span>
                          {g.updatedAt && (
                            <>
                              <span style={{ opacity: 0.35 }}>&#8226;</span>
                              <span>{fmtDate(g.updatedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
