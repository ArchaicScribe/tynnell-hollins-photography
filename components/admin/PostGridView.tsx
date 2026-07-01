'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type CoverImage = {
  url?: string | null
  sizes?: {
    hero?: { url?: string | null } | null
    card?: { url?: string | null } | null
    thumbnail?: { url?: string | null } | null
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
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return '' }
}

function getCoverUrl(post: PostDoc, size: 'hero' | 'card' = 'card'): string | null {
  if (!post.coverImage || typeof post.coverImage === 'number') return null
  const ci = post.coverImage as CoverImage
  if (size === 'hero') return ci.sizes?.hero?.url ?? ci.url ?? null
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
  const [toggleError, setToggleError] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [search])

  useEffect(() => {
    setLoading(true)
    setLoadError('')
    const params = new URLSearchParams({ limit: String(LIMIT), page: String(page), depth: '1', sort: '-publishedAt' })
    if (debouncedSearch) params.append('where[title][contains]', debouncedSearch)
    if (statusFilter !== 'all') params.append('where[status][equals]', statusFilter)
    fetch(`/api/posts?${params.toString()}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then(data => { setPosts(data.docs ?? []); setTotal(data.totalDocs ?? 0); setTotalPages(data.totalPages ?? 1); setLoading(false) })
      .catch(() => {
        setLoadError("Couldn't load posts. Check your connection and try again.")
        setLoading(false)
      })
  }, [debouncedSearch, statusFilter, page])

  const toggleStatus = useCallback(async (e: React.MouseEvent, post: PostDoc) => {
    e.preventDefault(); e.stopPropagation()
    if (togglingIds.has(post.id)) return
    setTogglingIds(prev => new Set([...prev, post.id]))
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    const body: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'published' && !post.publishedAt) body.publishedAt = new Date().toISOString()
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: newStatus, publishedAt: body.publishedAt as string ?? p.publishedAt } : p))
        if (statusFilter !== 'all') { setPosts(prev => prev.filter(p => p.id !== post.id || p.status === statusFilter)); setTotal(n => n - 1) }
      } else { setToggleError("Couldn't save - please try again."); setTimeout(() => setToggleError(''), 3500) }
    } catch { setToggleError("Couldn't save - please try again."); setTimeout(() => setToggleError(''), 3500) }
    finally { setTogglingIds(prev => { const n = new Set(prev); n.delete(post.id); return n }) }
  }, [togglingIds, statusFilter])

  const featuredPost = posts[0] ?? null
  const heroCover = featuredPost ? getCoverUrl(featuredPost, 'hero') : null

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
  ]

  return (
    <div style={{ fontFamily: 'Roboto Mono, monospace', color: 'var(--theme-text, #e6e1de)', minHeight: '100vh', background: 'var(--theme-bg, #0c0c0c)' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pgv-card:hover { border-color: var(--theme-elevation-300,#2a2a2a) !important; }
        .pgv-card:hover .pgv-card-img img { transform: scale(1.04); }
        .pgv-hero-img:hover img { transform: scale(1.025); }
      `}</style>

      {/* ── Hero cover image (matches public /blog layout) ── */}
      <div style={{ position: 'relative', width: '100%', height: '260px', overflow: 'hidden', background: 'var(--theme-elevation-100, #131313)', flexShrink: 0 }}>
        {heroCover && (
          <div className="pgv-hero-img" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.9s ease' }} />
          </div>
        )}
        {heroCover && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(12,12,12,0.05) 0%, rgba(12,12,12,0) 30%, rgba(12,12,12,0.65) 100%)' }} />
        )}
        {/* BLOG label */}
        <span style={{ position: 'absolute', bottom: '1.25rem', right: '1.5rem', fontFamily: 'Roboto Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', writingMode: 'vertical-rl', pointerEvents: 'none', zIndex: 2 }} aria-hidden="true">Blog</span>
        {/* New Post button — top right */}
        <Link href="/admin/collections/posts/create" style={{ position: 'absolute', top: '1rem', right: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.9rem', background: 'rgba(16,185,129,0.9)', backdropFilter: 'blur(4px)', color: '#fff', borderRadius: '3px', fontSize: '0.6rem', fontFamily: 'Roboto Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, textDecoration: 'none', zIndex: 3 }}>
          + New Post
        </Link>
      </div>

      {/* ── Filter bar (matches public /blog filter bar) ── */}
      <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', borderBottom: '1px solid var(--theme-elevation-200, #1e1e1e)', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
          {filters.map((f, i) => {
            const active = statusFilter === f.value
            return (
              <React.Fragment key={f.value}>
                {i > 0 && <span style={{ color: '#2a2a2a', fontSize: '0.55rem', padding: '0 0.6rem', userSelect: 'none' }}>·</span>}
                <button
                  onClick={() => { setStatusFilter(f.value); setPage(1) }}
                  aria-pressed={active}
                  style={{ background: 'none', border: 'none', borderBottom: active ? '1px solid var(--theme-text, #d6d1ce)' : '1px solid transparent', marginBottom: '-1px', padding: '0.9rem 0.15rem', fontFamily: 'Roboto Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: active ? 'var(--theme-text, #d6d1ce)' : 'var(--theme-text-dim, #9b9a9a)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s' }}
                >
                  {f.label}
                </button>
              </React.Fragment>
            )
          })}
          {!loading && (
            <span style={{ fontSize: '0.55rem', letterSpacing: '0.1em', color: 'var(--theme-text-dim, #9b9a9a)', opacity: 0.5, marginLeft: '1.25rem' }}>
              {total} {total === 1 ? 'post' : 'posts'}
            </span>
          )}
        </div>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 0' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ position: 'absolute', left: '0.5rem', color: 'var(--theme-text-dim, #9b9a9a)', pointerEvents: 'none' }}>
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.25" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Search..."
              aria-label="Search posts"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '0.35rem 0.6rem 0.35rem 1.7rem', background: 'var(--theme-elevation-100, #131313)', border: '1px solid var(--theme-elevation-200, #1a1a1a)', borderRadius: '2px', color: 'var(--theme-text, #e6e1de)', fontSize: '0.6rem', fontFamily: 'Roboto Mono, monospace', letterSpacing: '0.05em', outline: 'none', width: '140px' }}
            />
          </div>
        </div>
      </div>

      {toggleError && (
        <div role="alert" style={{ margin: '0.75rem 1.5rem', padding: '0.5rem 0.75rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 2, fontSize: '0.72rem', color: '#f0a3a3' }}>{toggleError}</div>
      )}
      {loadError && (
        <div role="alert" style={{ margin: '0.75rem 1.5rem', padding: '0.5rem 0.75rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 2, fontSize: '0.72rem', color: '#f0a3a3' }}>{loadError}</div>
      )}

      {/* ── 2-column post grid (matches public /blog grid) ── */}
      <div style={{ padding: '2rem 1.5rem' }}>
        {loadError ? null : loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem 1.5rem' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div style={{ width: '100%', paddingBottom: '66%', background: 'var(--theme-elevation-200, #1a1a1a)', borderRadius: '2px', animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: '0.75rem', background: 'var(--theme-elevation-200,#1a1a1a)', borderRadius: 2, marginTop: '0.85rem', animation: 'pulse 1.5s infinite', width: '70%' }} />
                <div style={{ height: '0.6rem', background: 'var(--theme-elevation-200,#1a1a1a)', borderRadius: 2, marginTop: '0.5rem', animation: 'pulse 1.5s infinite', width: '40%' }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--theme-text-dim, #9b9a9a)', fontSize: '0.72rem', letterSpacing: '0.08em' }}>
            {debouncedSearch || statusFilter !== 'all' ? 'No posts match your filters.' : 'No blog posts yet. Click + New Post above to write your first one.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2.5rem 1.5rem' }}>
            {posts.map(post => {
              const coverUrl = getCoverUrl(post)
              return (
                <div key={post.id} className="pgv-card" style={{ position: 'relative', border: '1px solid transparent', transition: 'border-color 0.15s', borderRadius: '2px', overflow: 'hidden' }}>
                  <Link href={`/admin/collections/posts/${post.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                    {/* Cover image — 3:2 ratio matching public blog cards */}
                    <div className="pgv-card-img" style={{ position: 'relative', width: '100%', paddingBottom: '66%', overflow: 'hidden', background: 'var(--theme-elevation-100, #131313)' }}>
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverUrl} alt={post.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }} loading="lazy" />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', color: 'var(--theme-elevation-400, #3a3a3a)' }}>&#9998;</div>
                      )}
                    </div>
                    {/* Card body */}
                    <div style={{ paddingTop: '0.85rem' }}>
                      {post.publishedAt && (
                        <div style={{ fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--theme-text-dim, #9b9a9a)', opacity: 0.65, marginBottom: '0.4rem' }}>
                          {formatDate(post.publishedAt)}
                        </div>
                      )}
                      <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: '1rem', fontWeight: 400, lineHeight: 1.25, color: 'var(--theme-text, #d6d1ce)', marginBottom: '0.4rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.title}
                      </div>
                      {post.excerpt && (
                        <div style={{ fontSize: '0.72rem', lineHeight: 1.6, color: 'var(--theme-text-dim, #9b9a9a)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.excerpt}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Publish/draft quick-toggle on cover image */}
                  <button
                    type="button"
                    onClick={(e) => { void toggleStatus(e, post) }}
                    disabled={togglingIds.has(post.id)}
                    aria-busy={togglingIds.has(post.id)}
                    aria-pressed={post.status === 'published'}
                    aria-label={post.status === 'published' ? 'Published - click to revert to draft' : 'Draft - click to publish'}
                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 1, padding: '0.2rem 0.55rem', background: post.status === 'published' ? 'rgba(16,185,129,0.85)' : 'rgba(80,80,80,0.8)', backdropFilter: 'blur(4px)', borderRadius: '2px', fontSize: '0.52rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', fontWeight: 600, border: 'none', cursor: togglingIds.has(post.id) ? 'wait' : 'pointer', opacity: togglingIds.has(post.id) ? 0.5 : 1, fontFamily: 'Roboto Mono, monospace', transition: 'background 0.15s' }}
                  >
                    {post.status ?? 'draft'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
            <button style={{ padding: '0.35rem 0.7rem', background: 'var(--theme-elevation-100,#131313)', border: '1px solid var(--theme-elevation-200,#1a1a1a)', borderRadius: '2px', color: 'var(--theme-text,#e6e1de)', fontSize: '0.65rem', fontFamily: 'Roboto Mono, monospace', letterSpacing: '0.08em', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            <span style={{ fontSize: '0.65rem', fontFamily: 'Roboto Mono, monospace', color: 'var(--theme-text-dim,#9b9a9a)' }}>{page} / {totalPages}</span>
            <button style={{ padding: '0.35rem 0.7rem', background: 'var(--theme-elevation-100,#131313)', border: '1px solid var(--theme-elevation-200,#1a1a1a)', borderRadius: '2px', color: 'var(--theme-text,#e6e1de)', fontSize: '0.65rem', fontFamily: 'Roboto Mono, monospace', letterSpacing: '0.08em', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
          </div>
        )}
      </div>
    </div>
  )
}
