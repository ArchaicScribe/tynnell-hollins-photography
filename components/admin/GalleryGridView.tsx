'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type CoverPhoto = {
  url?: string | null
  sizes?: {
    thumbnail?: { url?: string | null } | null
    card?: { url?: string | null } | null
  } | null
}

type GalleryDoc = {
  id: number
  title: string
  slug?: string | null
  category?: string | null
  status?: string | null
  featured?: boolean | null
  updatedAt?: string | null
  coverPhoto?: CoverPhoto | number | null
  photos?: { photo?: number | object | null; id?: string | null }[] | null
}

const CATEGORIES = ['weddings', 'portraits', 'families', 'couples', 'brands']
const LIMIT = 48

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function GalleryGridView() {
  const [galleries, setGalleries] = useState<GalleryDoc[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [toggleError, setToggleError] = useState('')
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set())
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [reordering, setReordering] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [search])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: String(LIMIT), page: String(page), depth: '1', sort: 'displayOrder' })
    if (debouncedSearch) params.append('where[title][contains]', debouncedSearch)
    if (category) params.append('where[category][equals]', category)
    if (statusFilter) params.append('where[status][equals]', statusFilter)

    fetch(`/api/galleries?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setGalleries(data.docs ?? [])
        setTotal(data.totalDocs ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setLoading(false)
      })
      .catch(() => { setLoading(false); setLoadError("Couldn't load collections. Check your connection and try again.") })
  }, [debouncedSearch, category, statusFilter, page])

  const toggleFeatured = useCallback(async (e: React.MouseEvent, gallery: GalleryDoc) => {
    e.preventDefault(); e.stopPropagation()
    if (togglingIds.has(gallery.id)) return
    setTogglingIds(prev => new Set([...prev, gallery.id]))
    try {
      const res = await fetch(`/api/galleries/${gallery.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !gallery.featured }),
      })
      if (res.ok) setGalleries(prev => prev.map(g => g.id === gallery.id ? { ...g, featured: !g.featured } : g))
      else { setToggleError("Couldn't save - please try again."); setTimeout(() => setToggleError(''), 3500) }
    } catch { setToggleError("Couldn't save - please try again."); setTimeout(() => setToggleError(''), 3500) }
    finally { setTogglingIds(prev => { const n = new Set(prev); n.delete(gallery.id); return n }) }
  }, [togglingIds])

  const canReorder = totalPages === 1 && !debouncedSearch && !category && !statusFilter && !loading

  const handleReorderDrop = useCallback(async (toIdx: number) => {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setOverIdx(null); return }
    const newOrder = [...galleries]
    const [moved] = newOrder.splice(dragIdx, 1)
    newOrder.splice(toIdx, 0, moved)
    setGalleries(newOrder); setDragIdx(null); setOverIdx(null); setReordering(true)
    try {
      await Promise.all(newOrder.map((g, i) =>
        fetch(`/api/galleries/${g.id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayOrder: i + 1 }) })
      ))
    } finally { setReordering(false) }
  }, [dragIdx, galleries])

  const getCoverUrl = (g: GalleryDoc): string | null => {
    if (!g.coverPhoto || typeof g.coverPhoto === 'number') return null
    const cp = g.coverPhoto as CoverPhoto
    return cp.sizes?.card?.url ?? cp.sizes?.thumbnail?.url ?? cp.url ?? null
  }

  const photoCount = (g: GalleryDoc): number => Array.isArray(g.photos) ? g.photos.length : 0

  const filtersActive = !!(debouncedSearch || category || statusFilter)

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'var(--font-body, system-ui, sans-serif)', color: 'var(--theme-text, #e6e1de)', minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .col-card:hover { border-color: rgba(214,209,206,0.2) !important; transform: translateY(-1px); }
        .col-card:hover .col-card-action { opacity: 1 !important; }
      `}</style>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 400, color: '#D6D1CE', fontFamily: 'Archivo, sans-serif', margin: 0, flex: '0 0 auto' }}>
          Collections
        </h2>
        <input
          type="search"
          placeholder="Search..."
          aria-label="Search collections"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 180px', minWidth: '120px', padding: '0.45rem 0.75rem', background: 'var(--theme-elevation-100,#131313)', border: '1px solid var(--theme-elevation-300,#2a2a2a)', borderRadius: '4px', color: 'var(--theme-text,#e6e1de)', fontSize: '0.85rem', outline: 'none' }}
        />
        {!loading && (
          <span style={{ fontSize: '0.8rem', color: 'var(--theme-text-dim,#9b9a9a)', whiteSpace: 'nowrap' }}>
            {total} {total === 1 ? 'collection' : 'collections'}
          </span>
        )}
        <Link
          href="/admin/collections/galleries/create"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: '#0d9488', color: '#fff', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: 'auto' }}
        >
          + New Collection
        </Link>
      </div>

      {/* Filter bar - mirrors Pixieset's filter row */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        {/* Status filter */}
        {[
          { label: 'All Status', value: null },
          { label: 'Published', value: 'published' },
          { label: 'Draft', value: 'draft' },
        ].map(opt => (
          <button
            key={opt.label}
            style={filterBtn(statusFilter === opt.value)}
            aria-pressed={statusFilter === opt.value}
            onClick={() => { setStatusFilter(opt.value); setPage(1) }}
          >
            {opt.value && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: opt.value === 'published' ? '#4ade80' : '#9B9A9A', display: 'inline-block', marginRight: '0.2rem' }} />
            )}
            {opt.label}
          </button>
        ))}

        <div style={{ width: '1px', height: '20px', background: 'rgba(155,154,154,0.15)', margin: '0 0.25rem' }} />

        {/* Category filter */}
        <button style={filterBtn(category === null)} aria-pressed={category === null} onClick={() => { setCategory(null); setPage(1) }}>All Categories</button>
        {CATEGORIES.map(cat => (
          <button key={cat} style={filterBtn(category === cat)} aria-pressed={category === cat} onClick={() => { setCategory(cat); setPage(1) }}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loadError && <div role="alert" style={alertStyle}>{loadError}</div>}
      {toggleError && <div role="alert" style={alertStyle}>{toggleError}</div>}

      {canReorder && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', padding: '0.35rem 0.6rem', background: 'rgba(155,154,154,0.05)', borderRadius: 4, border: '1px solid rgba(155,154,154,0.1)' }}>
          <span style={{ fontSize: '0.9rem', color: '#9b9a9a' }} aria-hidden="true">&#8942;&#8942;</span>
          <span style={{ fontSize: '0.75rem', color: '#9b9a9a' }}>
            {reordering ? 'Saving order...' : 'Drag collections to change the order they appear on your portfolio page.'}
          </span>
        </div>
      )}
      {!canReorder && !loading && filtersActive && (
        <div style={{ fontSize: '0.72rem', color: 'rgba(155,154,154,0.45)', marginBottom: '0.75rem' }}>
          Clear filters to enable drag-to-reorder.
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={gridStyle}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ borderRadius: '8px', paddingBottom: '70%', background: 'var(--theme-elevation-200,#1a1a1a)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : galleries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--theme-text-dim,#9b9a9a)', fontSize: '0.9rem' }}>
          {filtersActive ? 'No collections match your filters.' : 'No collections yet. Create your first one above.'}
        </div>
      ) : (
        <div style={gridStyle}>
          {galleries.map((gallery, i) => {
            const coverUrl = getCoverUrl(gallery)
            const count = photoCount(gallery)
            const isPublished = gallery.status === 'published'
            const isDragging = dragIdx === i
            const isOver = overIdx === i && dragIdx !== null && dragIdx !== i

            return (
              <div
                key={gallery.id}
                className="col-card"
                draggable={canReorder}
                onDragStart={() => canReorder && setDragIdx(i)}
                onDragEnter={() => canReorder && dragIdx !== null && setOverIdx(i)}
                onDragOver={e => { if (canReorder) e.preventDefault() }}
                onDrop={e => { e.preventDefault(); void handleReorderDrop(i) }}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                style={{
                  background: 'var(--theme-elevation-100,#131313)',
                  border: isOver ? '2px solid rgba(214,209,206,0.5)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: canReorder ? (isDragging ? 'grabbing' : 'grab') : undefined,
                  opacity: isDragging ? 0.4 : 1,
                  transition: 'opacity .12s, border-color .15s, transform 0.15s',
                }}
              >
                {/* Cover image */}
                <Link href={`/admin/collections/galleries/${gallery.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }} draggable={false}>
                  <div style={{ width: '100%', paddingBottom: '70%', position: 'relative', background: 'var(--theme-elevation-200,#1a1a1a)', overflow: 'hidden' }}>
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverUrl} alt={gallery.title} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--theme-elevation-400,#3a3a3a)' }}>
                        <span style={{ fontSize: '2rem' }}>&#128444;</span>
                        <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>No cover</span>
                      </div>
                    )}

                    {/* Featured badge (top-right) */}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); void toggleFeatured(e, gallery) }}
                      disabled={togglingIds.has(gallery.id)}
                      aria-busy={togglingIds.has(gallery.id)}
                      aria-pressed={gallery.featured ?? false}
                      aria-label={gallery.featured ? 'Remove from homepage' : 'Feature on homepage'}
                      title={gallery.featured ? 'Featured on homepage' : 'Click to feature on homepage'}
                      style={{
                        position: 'absolute', top: '0.5rem', right: '0.5rem',
                        padding: '0.18rem 0.45rem',
                        background: gallery.featured ? 'rgba(212,175,55,0.9)' : 'rgba(0,0,0,0.5)',
                        border: 'none', borderRadius: '3px',
                        fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: gallery.featured ? '#0c0c0c' : 'rgba(255,255,255,0.35)',
                        fontWeight: gallery.featured ? 700 : 400,
                        cursor: togglingIds.has(gallery.id) ? 'wait' : 'pointer',
                        opacity: togglingIds.has(gallery.id) ? 0.5 : 1,
                        fontFamily: 'inherit',
                      }}
                    >
                      Featured
                    </button>

                    {/* Drag dots overlay */}
                    {canReorder && (
                      <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', display: 'grid', gridTemplateColumns: 'repeat(2,4px)', gap: '3px', opacity: 0.5, pointerEvents: 'none' }}>
                        {Array.from({ length: 6 }).map((_, d) => <div key={d} style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff' }} />)}
                      </div>
                    )}
                  </div>

                  {/* Card info - matches Pixieset layout */}
                  <div style={{ padding: '0.75rem 0.875rem 0.5rem' }}>
                    <p style={{ fontSize: '0.92rem', fontWeight: 500, fontFamily: 'Archivo, sans-serif', color: '#E6E1DE', margin: '0 0 0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {gallery.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#6b6663' }}>
                      {/* Status dot */}
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: isPublished ? '#4ade80' : 'transparent', border: isPublished ? 'none' : '1.5px solid #6b6663', display: 'inline-block' }} />
                      <span>{count} {count === 1 ? 'item' : 'items'}</span>
                      {gallery.updatedAt && (
                        <>
                          <span style={{ opacity: 0.4 }}>•</span>
                          <span>{fmtDate(gallery.updatedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Action row - fades in on hover via CSS */}
                <div className="col-card-action" style={{ padding: '0 0.875rem 0.75rem', display: 'flex', gap: '0.4rem', opacity: 0, transition: 'opacity 0.15s' }}>
                  <a
                    href={`/gallery-editor/${gallery.id}`}
                    onClick={e => e.stopPropagation()}
                    draggable={false}
                    style={{ flex: 1, textAlign: 'center', padding: '0.38rem', background: 'rgba(214,209,206,0.07)', border: '1px solid rgba(214,209,206,0.12)', borderRadius: 4, color: '#d6d1ce', fontSize: '0.72rem', textDecoration: 'none', letterSpacing: '0.04em' }}
                  >
                    Open Editor
                  </a>
                  {isPublished && gallery.slug && (
                    <a
                      href={`/portfolio/${gallery.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      draggable={false}
                      title="View on site"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.38rem 0.6rem', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: 4, color: '#4ade80', fontSize: '0.72rem', textDecoration: 'none' }}
                    >
                      &#8599;
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          <button style={pageBtn(page === 1)} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span style={{ fontSize: '0.8rem', color: 'var(--theme-text-dim,#9b9a9a)' }}>{page} / {totalPages}</span>
          <button style={pageBtn(page === totalPages)} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '1rem',
}

const filterBtn = (active: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center',
  padding: '0.32rem 0.7rem',
  background: active ? 'rgba(214,209,206,0.12)' : 'transparent',
  border: `1px solid ${active ? 'rgba(214,209,206,0.3)' : 'rgba(155,154,154,0.18)'}`,
  borderRadius: '20px',
  color: active ? '#E6E1DE' : '#9b9a9a',
  fontSize: '0.72rem', letterSpacing: '0.04em',
  cursor: 'pointer', whiteSpace: 'nowrap',
  fontWeight: active ? 500 : 400,
})

const alertStyle: React.CSSProperties = {
  marginBottom: '0.75rem', padding: '0.55rem 0.75rem',
  background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
  borderRadius: 4, fontSize: '0.8rem', color: '#f0a3a3',
}

const pageBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '0.375rem 0.75rem',
  background: 'var(--theme-elevation-100,#131313)',
  border: '1px solid var(--theme-elevation-300,#2a2a2a)',
  borderRadius: '4px', color: 'var(--theme-text,#e6e1de)',
  fontSize: '0.8rem', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1,
})
