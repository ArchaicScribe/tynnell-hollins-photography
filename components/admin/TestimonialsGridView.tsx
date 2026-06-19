'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type TestimonialDoc = {
  id: number
  clientName?: string | null
  quote?: string | null
  sessionType?: string | null
  featured?: boolean | null
  displayOrder?: number | null
}

type TypeFilter = 'all' | 'Wedding' | 'Engagement' | 'Portrait' | 'Family' | 'Maternity' | 'Event'

const SESSION_TYPES: TypeFilter[] = ['all', 'Wedding', 'Engagement', 'Portrait', 'Family', 'Maternity', 'Event']

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
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  } as React.CSSProperties,
  card: {
    background: 'var(--theme-elevation-100, #131313)',
    borderRadius: '6px',
    overflow: 'hidden',
    textDecoration: 'none',
    color: 'inherit',
    display: 'flex',
    flexDirection: 'column' as const,
    border: '1px solid var(--theme-elevation-200, #1a1a1a)',
    transition: 'border-color 0.15s, transform 0.15s',
    padding: '1rem',
    minHeight: '140px',
  } as React.CSSProperties,
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  clientName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    fontFamily: 'Archivo, sans-serif',
    color: 'var(--theme-text, #e6e1de)',
    lineHeight: 1.3,
    flex: 1,
  } as React.CSSProperties,
  featuredBadge: {
    flexShrink: 0,
    padding: '0.14rem 0.45rem',
    background: 'rgba(155,154,154,0.14)',
    border: '1px solid rgba(155,154,154,0.25)',
    borderRadius: '3px',
    fontSize: '0.58rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#d6d1ce',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  quoteText: {
    fontSize: '0.78rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    lineHeight: 1.6,
    flex: 1,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    fontStyle: 'italic',
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  } as React.CSSProperties,
  sessionBadge: (type: string | null | undefined): React.CSSProperties => ({
    padding: '0.14rem 0.5rem',
    background: 'rgba(155,154,154,0.08)',
    border: '1px solid rgba(155,154,154,0.18)',
    borderRadius: '3px',
    fontSize: '0.62rem',
    letterSpacing: '0.06em',
    color: 'var(--theme-text-dim, #9b9a9a)',
    whiteSpace: 'nowrap',
    display: type ? 'inline-block' : 'none',
  }),
  orderNum: {
    fontSize: '0.62rem',
    color: 'rgba(155,154,154,0.5)',
    fontFamily: 'Roboto Mono, monospace',
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
    minHeight: '140px',
    animation: 'pulse 1.5s infinite',
  } as React.CSSProperties,
}

const filterBtn = (active: boolean): React.CSSProperties => ({
  padding: '0.3rem 0.7rem',
  background: active ? 'var(--theme-elevation-500, #9B9A9A)' : 'var(--theme-elevation-100, #131313)',
  border: `1px solid ${active ? 'transparent' : 'var(--theme-elevation-300, #2a2a2a)'}`,
  borderRadius: '20px',
  color: active ? '#fff' : 'var(--theme-text-dim, #9b9a9a)',
  fontSize: '0.68rem',
  letterSpacing: '0.08em',
  textTransform: 'capitalize',
  cursor: 'pointer',
  fontWeight: active ? 600 : 400,
  whiteSpace: 'nowrap',
})

const LIMIT = 48

export function TestimonialsGridView() {
  const [testimonials, setTestimonials] = useState<TestimonialDoc[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set())
  const [loadError, setLoadError] = useState('')
  const [toggleError, setToggleError] = useState('')

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [search])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      limit: String(LIMIT),
      page: String(page),
      depth: '0',
      sort: 'displayOrder',
    })
    if (debouncedSearch) {
      params.append('where[clientName][contains]', debouncedSearch)
    }
    if (typeFilter !== 'all') {
      params.append('where[sessionType][equals]', typeFilter)
    }
    if (featuredOnly) {
      params.append('where[featured][equals]', 'true')
    }

    fetch(`/api/testimonials?${params.toString()}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setTestimonials(data.docs ?? [])
        setTotal(data.totalDocs ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setLoading(false)
      })
      .catch(() => { setLoading(false); setLoadError("Couldn't load testimonials. Check your connection and try again.") })
  }, [debouncedSearch, typeFilter, featuredOnly, page])

  const toggleHomepage = async (e: React.MouseEvent, t: TestimonialDoc) => {
    e.preventDefault()
    e.stopPropagation()
    if (togglingIds.has(t.id)) return
    setTogglingIds(prev => new Set([...prev, t.id]))
    try {
      const res = await fetch(`/api/testimonials/${t.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !t.featured }),
      })
      if (res.ok) {
        setTestimonials(prev => prev.map(item =>
          item.id === t.id ? { ...item, featured: !item.featured } : item
        ))
        // If "Homepage only" filter is active and we just un-featured, remove from list
        if (featuredOnly && t.featured) {
          setTestimonials(prev => prev.filter(item => item.id !== t.id))
          setTotal(n => n - 1)
        }
      } else {
        setToggleError("Couldn't save - please try again.")
        setTimeout(() => setToggleError(''), 3500)
      }
    } catch {
      setToggleError("Couldn't save - please try again.")
      setTimeout(() => setToggleError(''), 3500)
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev)
        next.delete(t.id)
        return next
      })
    }
  }

  return (
    <div style={css.root}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .testimonial-card:hover { border-color: var(--theme-elevation-400, #3a3a3a) !important; transform: translateY(-2px); }
      `}</style>

      {/* Toolbar */}
      <div style={css.toolbar}>
        <input
          type="search"
          placeholder="Search by client name..."
          aria-label="Search testimonials by client name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={css.search}
        />
        {!loading && (
          <span style={css.count}>
            {total} {total === 1 ? 'testimonial' : 'testimonials'}
          </span>
        )}
        <Link href="/admin/collections/testimonials/create" style={css.newBtn}>
          + New Testimonial
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {SESSION_TYPES.map(type => (
          <button
            key={type}
            style={filterBtn(typeFilter === type)}
            aria-pressed={typeFilter === type}
            onClick={() => {
              setTypeFilter(type)
              setPage(1)
            }}
          >
            {type === 'all' ? 'All Types' : type}
          </button>
        ))}
        <span style={{ width: '1px', height: '16px', background: 'var(--theme-elevation-300, #2a2a2a)', margin: '0 0.2rem' }} />
        <button
          style={{
            ...filterBtn(featuredOnly),
            ...(featuredOnly ? { background: 'rgba(155,154,154,0.2)', borderColor: 'rgba(155,154,154,0.35)', color: '#d6d1ce' } : {}),
          }}
          aria-pressed={featuredOnly}
          onClick={() => {
            setFeaturedOnly(f => !f)
            setPage(1)
          }}
        >
          Homepage only
        </button>
      </div>

      {loadError && <div role="alert" style={{ marginBottom: '0.75rem', padding: '0.55rem 0.75rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 4, fontSize: '0.8rem', color: '#f0a3a3' }}>{loadError}</div>}
      {toggleError && <div role="alert" style={{ marginBottom: '0.75rem', padding: '0.55rem 0.75rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 4, fontSize: '0.8rem', color: '#f0a3a3' }}>{toggleError}</div>}

      {/* Grid */}
      {loading ? (
        <div style={css.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={css.skeleton} />
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <div style={css.empty}>
          {debouncedSearch || typeFilter !== 'all' || featuredOnly
            ? 'No testimonials match your filters.'
            : 'No testimonials yet. Click New Testimonial above to add your first one.'}
        </div>
      ) : (
        <div style={css.grid}>
          {testimonials.map(t => (
            <Link
              key={t.id}
              href={`/admin/collections/testimonials/${t.id}`}
              style={css.card}
              className="testimonial-card"
              title={t.clientName ?? ''}
            >
              <div style={css.cardTop}>
                <div style={css.clientName}>{t.clientName ?? 'Unnamed'}</div>
                <button
                  type="button"
                  onClick={(e) => { void toggleHomepage(e, t) }}
                  title={t.featured ? 'On homepage - click to remove' : 'Click to show on homepage'}
                  aria-label={t.featured ? 'Remove from homepage' : 'Show on homepage'}
                  aria-pressed={t.featured ?? false}
                  style={{
                    flexShrink: 0,
                    padding: '0.14rem 0.45rem',
                    background: t.featured ? 'rgba(155,154,154,0.14)' : 'transparent',
                    border: t.featured
                      ? '1px solid rgba(155,154,154,0.25)'
                      : '1px dashed rgba(155,154,154,0.2)',
                    borderRadius: '3px',
                    fontSize: '0.58rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase' as const,
                    color: t.featured ? '#d6d1ce' : 'rgba(155,154,154,0.4)',
                    fontWeight: t.featured ? 500 : 400,
                    whiteSpace: 'nowrap' as const,
                    cursor: togglingIds.has(t.id) ? 'wait' : 'pointer',
                    opacity: togglingIds.has(t.id) ? 0.5 : 1,
                    fontFamily: 'inherit',
                    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                  }}
                >
                  Homepage
                </button>
              </div>
              {t.quote && (
                <div style={css.quoteText}>&ldquo;{t.quote}&rdquo;</div>
              )}
              <div style={css.cardFooter}>
                {t.sessionType ? (
                  <span style={css.sessionBadge(t.sessionType)}>{t.sessionType}</span>
                ) : (
                  <span />
                )}
                {t.displayOrder != null && (
                  <span style={css.orderNum}>#{t.displayOrder}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '2rem',
          }}
        >
          <button
            style={{
              padding: '0.375rem 0.75rem',
              background: 'var(--theme-elevation-100,#131313)',
              border: '1px solid var(--theme-elevation-300,#2a2a2a)',
              borderRadius: '4px',
              color: 'var(--theme-text,#e6e1de)',
              fontSize: '0.8rem',
              cursor: page === 1 ? 'default' : 'pointer',
              opacity: page === 1 ? 0.4 : 1,
            }}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--theme-text-dim,#9b9a9a)' }}>
            {page} / {totalPages}
          </span>
          <button
            style={{
              padding: '0.375rem 0.75rem',
              background: 'var(--theme-elevation-100,#131313)',
              border: '1px solid var(--theme-elevation-300,#2a2a2a)',
              borderRadius: '4px',
              color: 'var(--theme-text,#e6e1de)',
              fontSize: '0.8rem',
              cursor: page === totalPages ? 'default' : 'pointer',
              opacity: page === totalPages ? 0.4 : 1,
            }}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
