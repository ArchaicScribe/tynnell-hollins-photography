'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type CoverImage = {
  url?: string | null
  sizes?: {
    thumbnail?: { url?: string | null } | null
    card?: { url?: string | null } | null
  } | null
}

type PostDoc = {
  id: number
  title: string
  slug?: string | null
  status?: 'draft' | 'published' | null
  publishedAt?: string | null
  excerpt?: string | null
  coverImage?: CoverImage | number | null
}

type StatusFilter = 'all' | 'published' | 'draft'

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
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
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
    paddingBottom: '52%',
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
    fontSize: '2.5rem',
    color: 'var(--theme-elevation-400, #3a3a3a)',
  } as React.CSSProperties,
  statusBadge: (status: 'draft' | 'published' | null | undefined): React.CSSProperties => ({
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    padding: '0.18rem 0.5rem',
    background: status === 'published' ? 'rgba(16,185,129,0.85)' : 'rgba(100,100,100,0.75)',
    backdropFilter: 'blur(4px)',
    borderRadius: '3px',
    fontSize: '0.58rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#fff',
    fontWeight: 600,
  }),
  cardBody: {
    padding: '0.75rem',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '0.875rem',
    fontWeight: 500,
    fontFamily: 'Archivo, sans-serif',
    lineHeight: 1.35,
    color: 'var(--theme-text, #e6e1de)',
    marginBottom: '0.3rem',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  } as React.CSSProperties,
  cardDate: {
    fontSize: '0.68rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    fontFamily: 'Roboto Mono, monospace',
  } as React.CSSProperties,
  cardExcerpt: {
    fontSize: '0.72rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    marginTop: '0.35rem',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
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
    paddingBottom: '52%',
    position: 'relative' as const,
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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export function PostGridView() {
  const [posts, setPosts] = useState<PostDoc[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
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
      sort: '-publishedAt',
    })
    if (debouncedSearch) {
      params.append('where[title][contains]', debouncedSearch)
    }
    if (statusFilter !== 'all') {
      params.append('where[status][equals]', statusFilter)
    }

    fetch(`/api/posts?${params.toString()}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setPosts(data.docs ?? [])
        setTotal(data.totalDocs ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [debouncedSearch, statusFilter, page])

  const toggleStatus = useCallback(async (e: React.MouseEvent, post: PostDoc) => {
    e.preventDefault()
    e.stopPropagation()
    if (togglingIds.has(post.id)) return
    setTogglingIds(prev => new Set([...prev, post.id]))
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    const body: Record<string, unknown> = { status: newStatus }
    // Set publishedAt on first publish if not already set
    if (newStatus === 'published' && !post.publishedAt) {
      body.publishedAt = new Date().toISOString()
    }
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setPosts(prev => prev.map(p =>
          p.id === post.id
            ? { ...p, status: newStatus, publishedAt: body.publishedAt as string | undefined ?? p.publishedAt }
            : p
        ))
        // Remove from list if status filter is active and no longer matches
        if (statusFilter !== 'all') {
          setPosts(prev => prev.filter(p => p.id !== post.id || p.status === statusFilter))
          setTotal(n => n - 1)
        }
      }
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev)
        next.delete(post.id)
        return next
      })
    }
  }, [togglingIds, statusFilter])

  const getCoverUrl = (post: PostDoc): string | null => {
    if (!post.coverImage || typeof post.coverImage === 'number') return null
    const ci = post.coverImage as CoverImage
    return ci.sizes?.card?.url ?? ci.sizes?.thumbnail?.url ?? ci.url ?? null
  }

  return (
    <div style={css.root}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .post-card:hover { border-color: var(--theme-elevation-400, #3a3a3a) !important; transform: translateY(-2px); }
      `}</style>

      {/* Toolbar */}
      <div style={css.toolbar}>
        <input
          type="search"
          placeholder="Search posts..."
          aria-label="Search posts"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={css.search}
        />
        {!loading && (
          <span style={css.count}>{total} {total === 1 ? 'post' : 'posts'}</span>
        )}
        <Link href="/admin/collections/posts/create" style={css.newBtn}>
          + New Post
        </Link>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
        {(['all', 'published', 'draft'] as StatusFilter[]).map(s => (
          <button
            key={s}
            style={{
              ...filterBtn(statusFilter === s),
              ...(s === 'published' && statusFilter === s ? { background: 'rgba(16,185,129,0.2)', color: '#10B981', borderColor: 'transparent' } : {}),
            }}
            aria-pressed={statusFilter === s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={css.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={css.skeleton} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={css.empty}>
          {debouncedSearch || statusFilter !== 'all'
            ? 'No posts match your filters.'
            : 'No blog posts yet. Click New Post above to write your first one.'}
        </div>
      ) : (
        <div style={css.grid}>
          {posts.map(post => {
            const coverUrl = getCoverUrl(post)
            return (
              <Link
                key={post.id}
                href={`/admin/collections/posts/${post.id}`}
                style={css.card}
                className="post-card"
                title={post.title}
              >
                <div style={css.imgWrap}>
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt={post.title} style={css.img} loading="lazy" />
                  ) : (
                    <div style={css.placeholder}>&#9998;</div>
                  )}
                  {/* Publish/Draft quick-toggle */}
                  <button
                    type="button"
                    onClick={(e) => { void toggleStatus(e, post) }}
                    title={post.status === 'published' ? 'Published - click to revert to draft' : 'Draft - click to publish'}
                    aria-label={post.status === 'published' ? 'Published - click to revert to draft' : 'Draft - click to publish'}
                    aria-pressed={post.status === 'published'}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      padding: '0.18rem 0.5rem',
                      background: post.status === 'published'
                        ? 'rgba(16,185,129,0.85)'
                        : 'rgba(100,100,100,0.75)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: '3px',
                      fontSize: '0.58rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase' as const,
                      color: '#fff',
                      fontWeight: 600,
                      border: 'none',
                      cursor: togglingIds.has(post.id) ? 'wait' : 'pointer',
                      opacity: togglingIds.has(post.id) ? 0.5 : 1,
                      fontFamily: 'inherit',
                      transition: 'background 0.15s',
                    }}
                  >
                    {post.status ?? 'draft'}
                  </button>
                </div>
                <div style={css.cardBody}>
                  <div style={css.cardTitle}>{post.title}</div>
                  {post.publishedAt && (
                    <div style={css.cardDate}>{formatDate(post.publishedAt)}</div>
                  )}
                  {post.excerpt && (
                    <div style={css.cardExcerpt}>{post.excerpt}</div>
                  )}
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
