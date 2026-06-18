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
  featured?: boolean | null
  coverPhoto?: CoverPhoto | number | null
  photos?: { photo?: number | object | null; id?: string | null }[] | null
}

const CATEGORIES = ['weddings', 'portraits', 'families', 'couples', 'brands']

const css = {
  root: {
    padding: '1.5rem',
    fontFamily: 'var(--font-body, system-ui, sans-serif)',
    color: 'var(--theme-text, #e6e1de)',
    minHeight: '100vh',
  } as React.CSSProperties,
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  search: {
    flex: '1 1 200px',
    minWidth: '140px',
    padding: '0.5rem 0.75rem',
    background: 'var(--theme-elevation-100, #131313)',
    border: '1px solid var(--theme-elevation-300, #2a2a2a)',
    borderRadius: '4px',
    color: 'var(--theme-text, #e6e1de)',
    fontSize: '0.875rem',
    outline: 'none',
  } as React.CSSProperties,
  filters: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  filterBtn: (active: boolean): React.CSSProperties => ({
    padding: '0.35rem 0.75rem',
    background: active ? 'var(--theme-elevation-500, #9B9A9A)' : 'var(--theme-elevation-100, #131313)',
    border: `1px solid ${active ? 'transparent' : 'var(--theme-elevation-300, #2a2a2a)'}`,
    borderRadius: '20px',
    color: active ? '#fff' : 'var(--theme-text-dim, #9b9a9a)',
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    textTransform: 'capitalize',
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
    whiteSpace: 'nowrap',
  }),
  newBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.5rem 1rem',
    background: 'var(--theme-success-500, #10B981)',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
    marginLeft: 'auto',
  } as React.CSSProperties,
  count: {
    fontSize: '0.8rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
  } as React.CSSProperties,
  card: {
    background: 'var(--theme-elevation-100, #131313)',
    borderRadius: '6px',
    overflow: 'hidden',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    border: '1px solid var(--theme-elevation-200, #1a1a1a)',
    transition: 'border-color 0.15s, transform 0.15s',
  } as React.CSSProperties,
  imgWrap: {
    width: '100%',
    paddingBottom: '62.5%', // 16:10, landscape photography feel
    position: 'relative' as const,
    background: 'var(--theme-elevation-200, #1a1a1a)',
    overflow: 'hidden',
  } as React.CSSProperties,
  img: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  } as React.CSSProperties,
  placeholder: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    color: 'var(--theme-elevation-400, #3a3a3a)',
    fontSize: '2rem',
  } as React.CSSProperties,
  placeholderText: {
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--theme-elevation-400, #3a3a3a)',
  } as React.CSSProperties,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  badge: (_category: string): React.CSSProperties => ({
    position: 'absolute',
    top: '0.5rem',
    left: '0.5rem',
    padding: '0.2rem 0.5rem',
    background: 'rgba(12,12,12,0.75)',
    backdropFilter: 'blur(4px)',
    borderRadius: '3px',
    fontSize: '0.6rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#E6E1DE',
    fontWeight: 600,
  }),
  featuredBadge: {
    position: 'absolute' as const,
    top: '0.5rem',
    right: '0.5rem',
    padding: '0.2rem 0.45rem',
    background: 'rgba(212,175,55,0.85)',
    borderRadius: '3px',
    fontSize: '0.6rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#0c0c0c',
    fontWeight: 700,
  } as React.CSSProperties,
  cardBody: {
    padding: '0.625rem 0.75rem',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '0.875rem',
    fontWeight: 500,
    fontFamily: 'Archivo, sans-serif',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    color: 'var(--theme-text, #e6e1de)',
    marginBottom: '0.2rem',
  } as React.CSSProperties,
  cardMeta: {
    fontSize: '0.7rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: '4rem 2rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  skeleton: {
    background: 'var(--theme-elevation-200, #1a1a1a)',
    borderRadius: '6px',
    paddingBottom: '62.5%',
    position: 'relative' as const,
    animation: 'pulse 1.5s infinite',
  } as React.CSSProperties,
}

const LIMIT = 48

export function GalleryGridView() {
  const [galleries, setGalleries] = useState<GalleryDoc[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [search])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      limit: String(LIMIT),
      page: String(page),
      depth: '1',
      sort: '-updatedAt',
    })
    if (debouncedSearch) {
      params.append('where[title][contains]', debouncedSearch)
    }
    if (category) {
      params.append('where[category][equals]', category)
    }

    fetch(`/api/galleries?${params.toString()}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setGalleries(data.docs ?? [])
        setTotal(data.totalDocs ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [debouncedSearch, category, page])

  const toggleFeatured = useCallback(async (e: React.MouseEvent, gallery: GalleryDoc) => {
    e.preventDefault()
    e.stopPropagation()
    if (togglingIds.has(gallery.id)) return
    setTogglingIds(prev => new Set([...prev, gallery.id]))
    try {
      const res = await fetch(`/api/galleries/${gallery.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !gallery.featured }),
      })
      if (res.ok) {
        setGalleries(prev => prev.map(g =>
          g.id === gallery.id ? { ...g, featured: !g.featured } : g
        ))
      }
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev)
        next.delete(gallery.id)
        return next
      })
    }
  }, [togglingIds])

  const getCoverUrl = (g: GalleryDoc): string | null => {
    if (!g.coverPhoto || typeof g.coverPhoto === 'number') return null
    const cp = g.coverPhoto as CoverPhoto
    return cp.sizes?.card?.url ?? cp.sizes?.thumbnail?.url ?? cp.url ?? null
  }

  const photoCount = (g: GalleryDoc): number =>
    Array.isArray(g.photos) ? g.photos.length : 0

  return (
    <div style={css.root}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .gallery-card:hover { border-color: var(--theme-elevation-400, #3a3a3a) !important; transform: translateY(-2px); }
      `}</style>

      {/* Toolbar row 1: search + new button */}
      <div style={css.toolbar}>
        <input
          type="search"
          placeholder="Search galleries..."
          aria-label="Search galleries"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={css.search}
        />
        {!loading && (
          <span style={css.count}>{total} {total === 1 ? 'gallery' : 'galleries'}</span>
        )}
        <Link href="/admin/collections/galleries/create" style={css.newBtn}>
          + New Gallery
        </Link>
      </div>

      {/* Category filter pills */}
      <div style={{ ...css.filters, marginBottom: '1.25rem' }}>
        <button
          style={css.filterBtn(category === null)}
          aria-pressed={category === null}
          onClick={() => { setCategory(null); setPage(1) }}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            style={css.filterBtn(category === cat)}
            aria-pressed={category === cat}
            onClick={() => { setCategory(cat); setPage(1) }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={css.grid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={css.skeleton} />
          ))}
        </div>
      ) : galleries.length === 0 ? (
        <div style={css.empty}>
          {debouncedSearch || category
            ? 'No galleries match your filters.'
            : 'No galleries yet. Create your first one above.'}
        </div>
      ) : (
        <div style={css.grid}>
          {galleries.map(gallery => {
            const coverUrl = getCoverUrl(gallery)
            const count = photoCount(gallery)
            return (
              <Link
                key={gallery.id}
                href={`/admin/collections/galleries/${gallery.id}`}
                style={css.card}
                className="gallery-card"
                title={gallery.title}
              >
                <div style={css.imgWrap}>
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt={gallery.title} style={css.img} loading="lazy" />
                  ) : (
                    <div style={css.placeholder}>
                      <span>&#128444;</span>
                      <span style={css.placeholderText}>No cover</span>
                    </div>
                  )}
                  {gallery.category && (
                    <div style={css.badge(gallery.category)}>{gallery.category}</div>
                  )}
                  {/* Featured quick-toggle */}
                  <button
                    type="button"
                    onClick={(e) => { void toggleFeatured(e, gallery) }}
                    disabled={togglingIds.has(gallery.id)}
                    aria-busy={togglingIds.has(gallery.id)}
                    title={gallery.featured ? 'Featured on homepage - click to remove' : 'Click to feature on homepage'}
                    aria-label={gallery.featured ? 'Remove from homepage' : 'Feature on homepage'}
                    aria-pressed={gallery.featured ?? false}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      padding: '0.18rem 0.45rem',
                      background: gallery.featured ? 'rgba(212,175,55,0.85)' : 'rgba(0,0,0,0.45)',
                      borderRadius: '3px',
                      fontSize: '0.58rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase' as const,
                      color: gallery.featured ? '#0c0c0c' : 'rgba(255,255,255,0.35)',
                      fontWeight: gallery.featured ? 700 : 400,
                      cursor: togglingIds.has(gallery.id) ? 'wait' : 'pointer',
                      opacity: togglingIds.has(gallery.id) ? 0.5 : 1,
                      border: 'none',
                      fontFamily: 'inherit',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    Featured
                  </button>
                </div>
                <div style={css.cardBody}>
                  <div style={css.cardTitle}>{gallery.title}</div>
                  <div style={css.cardMeta}>
                    {count > 0 ? `${count} photo${count !== 1 ? 's' : ''}` : 'No photos yet'}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          <button
            style={{ padding: '0.375rem 0.75rem', background: 'var(--theme-elevation-100,#131313)', border: '1px solid var(--theme-elevation-300,#2a2a2a)', borderRadius: '4px', color: 'var(--theme-text,#e6e1de)', fontSize: '0.8rem', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >Prev</button>
          <span style={{ fontSize: '0.8rem', color: 'var(--theme-text-dim,#9b9a9a)' }}>
            {page} / {totalPages}
          </span>
          <button
            style={{ padding: '0.375rem 0.75rem', background: 'var(--theme-elevation-100,#131313)', border: '1px solid var(--theme-elevation-300,#2a2a2a)', borderRadius: '4px', color: 'var(--theme-text,#e6e1de)', fontSize: '0.8rem', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >Next</button>
        </div>
      )}
    </div>
  )
}
