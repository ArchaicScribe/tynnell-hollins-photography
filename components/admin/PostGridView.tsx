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

const LIMIT = 48

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function getCoverUrl(post: PostDoc): string | null {
  if (!post.coverImage || typeof post.coverImage === 'number') return null
  const ci = post.coverImage as CoverImage
  return ci.sizes?.card?.url ?? ci.sizes?.thumbnail?.url ?? ci.url ?? null
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
  const [loadError, setLoadError] = useState('')
  const [toggleError, setToggleError] = useState('')

  // Strip Payload's default query params from the URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

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
    if (debouncedSearch) params.append('where[title][contains]', debouncedSearch)
    if (statusFilter !== 'all') params.append('where[status][equals]', statusFilter)

    fetch(`/api/posts?${params.toString()}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setPosts(data.docs ?? [])
        setTotal(data.totalDocs ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setLoading(false)
      })
      .catch(() => { setLoading(false); setLoadError("Couldn't load posts. Check your connection and try again.") })
  }, [debouncedSearch, statusFilter, page])

  const toggleStatus = useCallback(async (e: React.MouseEvent, post: PostDoc) => {
    e.preventDefault()
    e.stopPropagation()
    if (togglingIds.has(post.id)) return
    setTogglingIds(prev => new Set([...prev, post.id]))
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    const body: Record<string, unknown> = { status: newStatus }
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
        if (statusFilter !== 'all') {
          setPosts(prev => prev.filter(p => p.id !== post.id || p.status === statusFilter))
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
      setTogglingIds(prev => { const next = new Set(prev); next.delete(post.id); return next })
    }
  }, [togglingIds, statusFilter])

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-body, system-ui)', color: 'var(--theme-text, #e6e1de)', minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .post-card:hover { border-color: var(--theme-elevation-400, #3a3a3a) !important; transform: translateY(-2px); }
        .post-card-img:hover img { transform: scale(1.04); }
      `}</style>

      {/* Filter bar — Pixieset horizontal tab style */}
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--theme-elevation-200, #1e1e1e)',
        padding: '0 1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {filters.map((f, i) => {
            const active = statusFilter === f.value
            return (
              <React.Fragment key={f.value}>
                {i > 0 && (
                  <span style={{ color: 'var(--theme-elevation-400, #3a3a3a)', fontSize: '0.6rem', padding: '0 0.5rem', userSelect: 'none' }}>·</span>
                )}
                <button
                  onClick={() => { setStatusFilter(f.value); setPage(1) }}
                  aria-pressed={active}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: active ? '1px solid var(--theme-text, #d6d1ce)' : '1px solid transparent',
                    marginBottom: '-1px',
                    padding: '1rem 0.25rem',
                    fontFamily: 'Roboto Mono, monospace',
                    fontSize: '0.6rem',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: active ? 'var(--theme-text, #d6d1ce)' : 'var(--theme-text-dim, #9b9a9a)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                  }}
                >
                  {f.label}
                </button>
              </React.Fragment>
            )
          })}
          {!loading && (
            <span style={{ fontFamily: 'Roboto Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.1em', color: 'var(--theme-text-dim, #9b9a9a)', opacity: 0.55, marginLeft: '1.25rem' }}>
              {total} {total === 1 ? 'post' : 'posts'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0' }}>
          {/* Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ position: 'absolute', left: '0.5rem', color: 'var(--theme-text-dim, #9b9a9a)', pointerEvents: 'none' }}>
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.25" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Search posts..."
              aria-label="Search posts"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '0.4rem 0.6rem 0.4rem 1.75rem',
                background: 'var(--theme-elevation-100, #131313)',
                border: '1px solid var(--theme-elevation-300, #2a2a2a)',
                borderRadius: '3px',
                color: 'var(--theme-text, #e6e1de)',
                fontSize: '0.72rem',
                fontFamily: 'Roboto Mono, monospace',
                outline: 'none',
                width: '180px',
              }}
            />
          </div>

          {/* New Post button */}
          <Link
            href="/admin/collections/posts/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.45rem 1rem',
              background: 'var(--theme-success-500, #10B981)',
              color: '#fff',
              borderRadius: '3px',
              fontSize: '0.68rem',
              fontFamily: 'Roboto Mono, monospace',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            + New Post
          </Link>
        </div>
      </div>

      {/* Error alerts */}
      {loadError && (
        <div role="alert" style={{ margin: '1rem 1.5rem 0', padding: '0.55rem 0.75rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 3, fontSize: '0.78rem', color: '#f0a3a3' }}>
          {loadError}
        </div>
      )}
      {toggleError && (
        <div role="alert" style={{ margin: '1rem 1.5rem 0', padding: '0.55rem 0.75rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 3, fontSize: '0.78rem', color: '#f0a3a3' }}>
          {toggleError}
        </div>
      )}

      {/* Grid */}
      <div style={{ padding: '1.75rem 1.5rem' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--theme-elevation-200, #1a1a1a)', borderRadius: '4px', paddingBottom: '52%', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--theme-text-dim, #9b9a9a)', fontSize: '0.8rem', fontFamily: 'Roboto Mono, monospace', letterSpacing: '0.08em' }}>
            {debouncedSearch || statusFilter !== 'all'
              ? 'No posts match your filters.'
              : 'No blog posts yet. Click New Post above to write your first one.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {posts.map(post => {
              const coverUrl = getCoverUrl(post)
              return (
                <div key={post.id} style={{ position: 'relative', background: 'var(--theme-elevation-100, #131313)', border: '1px solid var(--theme-elevation-200, #1a1a1a)', borderRadius: '4px', overflow: 'hidden', transition: 'border-color 0.15s, transform 0.15s' }} className="post-card">
                  <Link href={`/admin/collections/posts/${post.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }} title={post.title}>
                    <div style={{ width: '100%', paddingBottom: '60%', position: 'relative', background: 'var(--theme-elevation-200, #1a1a1a)', overflow: 'hidden' }} className="post-card-img">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverUrl} alt={post.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} loading="lazy" />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--theme-elevation-400, #3a3a3a)' }}>&#9998;</div>
                      )}
                    </div>
                    <div style={{ padding: '0.85rem 0.9rem 1rem' }}>
                      <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.35, color: 'var(--theme-text, #e6e1de)', marginBottom: '0.3rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.title}
                      </div>
                      {post.publishedAt && (
                        <div style={{ fontFamily: 'Roboto Mono, monospace', fontSize: '0.65rem', color: 'var(--theme-text-dim, #9b9a9a)', letterSpacing: '0.06em' }}>
                          {formatDate(post.publishedAt)}
                        </div>
                      )}
                      {post.excerpt && (
                        <div style={{ fontFamily: 'Roboto Mono, monospace', fontSize: '0.68rem', color: 'var(--theme-text-dim, #9b9a9a)', marginTop: '0.4rem', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.excerpt}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Publish/draft quick-toggle — sibling of Link, not child */}
                  <button
                    type="button"
                    onClick={(e) => { void toggleStatus(e, post) }}
                    disabled={togglingIds.has(post.id)}
                    aria-busy={togglingIds.has(post.id)}
                    aria-pressed={post.status === 'published'}
                    aria-label={post.status === 'published' ? 'Published - click to revert to draft' : 'Draft - click to publish'}
                    title={post.status === 'published' ? 'Published - click to revert to draft' : 'Draft - click to publish'}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      zIndex: 1,
                      padding: '0.18rem 0.5rem',
                      background: post.status === 'published' ? 'rgba(16,185,129,0.85)' : 'rgba(100,100,100,0.75)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: '3px',
                      fontSize: '0.55rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#fff',
                      fontWeight: 600,
                      border: 'none',
                      cursor: togglingIds.has(post.id) ? 'wait' : 'pointer',
                      opacity: togglingIds.has(post.id) ? 0.5 : 1,
                      fontFamily: 'Roboto Mono, monospace',
                      transition: 'background 0.15s',
                    }}
                  >
                    {post.status ?? 'draft'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
            <button
              style={{ padding: '0.375rem 0.75rem', background: 'var(--theme-elevation-100,#131313)', border: '1px solid var(--theme-elevation-300,#2a2a2a)', borderRadius: '3px', color: 'var(--theme-text,#e6e1de)', fontSize: '0.72rem', fontFamily: 'Roboto Mono, monospace', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >Prev</button>
            <span style={{ fontSize: '0.72rem', fontFamily: 'Roboto Mono, monospace', color: 'var(--theme-text-dim,#9b9a9a)' }}>
              {page} / {totalPages}
            </span>
            <button
              style={{ padding: '0.375rem 0.75rem', background: 'var(--theme-elevation-100,#131313)', border: '1px solid var(--theme-elevation-300,#2a2a2a)', borderRadius: '3px', color: 'var(--theme-text,#e6e1de)', fontSize: '0.72rem', fontFamily: 'Roboto Mono, monospace', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >Next</button>
          </div>
        )}
      </div>
    </div>
  )
}
