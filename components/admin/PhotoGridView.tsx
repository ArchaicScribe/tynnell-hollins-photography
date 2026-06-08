'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type PhotoDoc = {
  id: number
  filename: string
  title?: string | null
  category?: string | null
  url?: string | null
  sizes?: {
    thumbnail?: { url?: string | null } | null
    card?: { url?: string | null } | null
  } | null
}

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
    marginBottom: '1.5rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  search: {
    flex: '1 1 220px',
    minWidth: '160px',
    padding: '0.5rem 0.75rem',
    background: 'var(--theme-elevation-100, #131313)',
    border: '1px solid var(--theme-elevation-300, #2a2a2a)',
    borderRadius: '4px',
    color: 'var(--theme-text, #e6e1de)',
    fontSize: '0.875rem',
    outline: 'none',
  } as React.CSSProperties,
  uploadBtn: {
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
    border: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  count: {
    fontSize: '0.8rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '0.875rem',
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
    paddingBottom: '75%',
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
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    color: 'var(--theme-elevation-400, #3a3a3a)',
  } as React.CSSProperties,
  cardBody: {
    padding: '0.5rem 0.625rem',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '0.75rem',
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
    textTransform: 'capitalize' as const,
  } as React.CSSProperties,
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '2rem',
  } as React.CSSProperties,
  pageBtn: {
    padding: '0.375rem 0.75rem',
    background: 'var(--theme-elevation-100, #131313)',
    border: '1px solid var(--theme-elevation-300, #2a2a2a)',
    borderRadius: '4px',
    color: 'var(--theme-text, #e6e1de)',
    fontSize: '0.8rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  pageBtnActive: {
    background: 'var(--theme-success-500, #10B981)',
    borderColor: 'var(--theme-success-500, #10B981)',
    color: '#fff',
    fontWeight: 600,
  } as React.CSSProperties,
  pageBtnDisabled: {
    opacity: 0.4,
    cursor: 'default',
    pointerEvents: 'none' as const,
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
    paddingBottom: '75%',
    position: 'relative' as const,
    animation: 'pulse 1.5s infinite',
  } as React.CSSProperties,
}

const LIMIT = 48

export function PhotoGridView() {
  const [photos, setPhotos] = useState<PhotoDoc[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

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
    })
    if (debouncedSearch) {
      params.append('where[or][0][title][contains]', debouncedSearch)
      params.append('where[or][1][filename][contains]', debouncedSearch)
    }

    fetch(`/api/photos?${params.toString()}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setPhotos(data.docs ?? [])
        setTotal(data.totalDocs ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [debouncedSearch, page])

  const skeletonCount = 24

  return (
    <div style={css.root}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .photo-card:hover {
          border-color: var(--theme-elevation-400, #3a3a3a) !important;
          transform: translateY(-2px);
        }
      `}</style>

      {/* Toolbar */}
      <div style={css.toolbar}>
        <input
          type="search"
          placeholder="Search by name or filename..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={css.search}
        />
        {!loading && (
          <span style={css.count}>
            {total} photo{total !== 1 ? 's' : ''}
          </span>
        )}
        <Link href="/admin/collections/photos/create" style={css.uploadBtn}>
          + Upload Photos
        </Link>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={css.grid}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} style={css.skeleton} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div style={css.empty}>
          {debouncedSearch
            ? `No photos matching "${debouncedSearch}"`
            : 'No photos yet. Upload your first batch above.'}
        </div>
      ) : (
        <div style={css.grid}>
          {photos.map(photo => {
            const thumbUrl = photo.sizes?.thumbnail?.url ?? photo.sizes?.card?.url ?? photo.url
            const label = photo.title ?? photo.filename
            return (
              <Link
                key={photo.id}
                href={`/admin/collections/photos/${photo.id}`}
                style={css.card}
                className="photo-card"
                title={label}
              >
                <div style={css.imgWrap}>
                  {thumbUrl ? (
                    <img src={thumbUrl} alt={label} style={css.img} loading="lazy" />
                  ) : (
                    <div style={css.placeholder}>&#128247;</div>
                  )}
                </div>
                <div style={css.cardBody}>
                  <div style={css.cardTitle}>{label}</div>
                  {photo.category && (
                    <div style={css.cardMeta}>{photo.category}</div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div style={css.pagination}>
          <button
            style={{ ...css.pageBtn, ...(page === 1 ? css.pageBtnDisabled : {}) }}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              style={{ ...css.pageBtn, ...(page === i + 1 ? css.pageBtnActive : {}) }}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            style={{ ...css.pageBtn, ...(page === totalPages ? css.pageBtnDisabled : {}) }}
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
