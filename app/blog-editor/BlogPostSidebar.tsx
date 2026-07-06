'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Persistent post list for the in-context editor. Fetch/filter/search logic
// ported verbatim from components/admin/PostGridView.tsx (that component is
// being retired once this editor is the primary path - see cleanup step),
// restyled from a 2-column grid into a single-column sidebar list.

type CoverImage = {
  url?: string | null
  sizes?: { thumbnail?: { url?: string | null } | null; card?: { url?: string | null } | null } | null
}

type PostDoc = {
  id: number
  title: string
  slug?: string | null
  status?: 'draft' | 'published' | null
  publishedAt?: string | null
  coverImage?: CoverImage | number | null
}

type StatusFilter = 'all' | 'published' | 'draft'

const LIMIT = 48

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return '' }
}

function getThumbUrl(post: PostDoc): string | null {
  if (!post.coverImage || typeof post.coverImage === 'number') return null
  const ci = post.coverImage as CoverImage
  return ci.sizes?.thumbnail?.url ?? ci.sizes?.card?.url ?? ci.url ?? null
}

const filters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
]

export function BlogPostSidebar({ selectedSlug }: { selectedSlug: string | null }) {
  const router = useRouter()
  const [posts, setPosts] = useState<PostDoc[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleNewPost = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/blog-editor/create', { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error('create failed')
      const { slug } = await res.json()
      router.push(`/blog-editor/${slug}`)
    } catch {
      setCreating(false)
    }
  }

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [search])

  useEffect(() => {
    setLoading(true)
    setLoadError('')
    const params = new URLSearchParams({ limit: String(LIMIT), depth: '1', sort: '-publishedAt' })
    if (debouncedSearch) params.append('where[title][contains]', debouncedSearch)
    if (statusFilter !== 'all') params.append('where[status][equals]', statusFilter)
    fetch(`/api/posts?${params.toString()}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then(data => { setPosts(data.docs ?? []); setLoading(false) })
      .catch(() => { setLoadError("Couldn't load posts."); setLoading(false) })
  }, [debouncedSearch, statusFilter])

  return (
    <aside style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
      <div style={{ padding: '1.25rem 1.25rem 0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-heading)' }}>Blog</h1>
          <button
            type="button"
            onClick={() => { void handleNewPost() }}
            disabled={creating}
            aria-busy={creating}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-bg)', background: 'var(--color-btn-bg)', padding: '0.35rem 0.7rem', borderRadius: 3, border: 'none', cursor: creating ? 'default' : 'pointer', opacity: creating ? 0.6 : 1 }}
          >
            {creating ? 'Creating...' : '+ New Post'}
          </button>
        </div>

        <input
          type="search"
          placeholder="Search posts..."
          aria-label="Search posts"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.6rem', background: 'var(--color-bg-accent)', border: '1px solid var(--color-border)', borderRadius: 3, color: 'var(--color-body)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', outline: 'none', marginBottom: '0.75rem' }}
        />

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {filters.map(f => {
            const active = statusFilter === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                aria-pressed={active}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: 20,
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  background: active ? 'var(--color-heading)' : 'transparent',
                  color: active ? 'var(--color-bg)' : 'var(--color-detail)',
                  border: `1px solid ${active ? 'transparent' : 'var(--color-border)'}`,
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {loadError && (
        <div role="alert" style={{ margin: '0 1.25rem 0.75rem', padding: '0.5rem 0.65rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 3, fontSize: '0.72rem', color: '#f0a3a3' }}>
          {loadError}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.75rem 1.25rem' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 64, background: 'var(--color-bg-accent)', borderRadius: 4, margin: '0 0.5rem 0.5rem' }} />
          ))
        ) : posts.length === 0 ? (
          <p style={{ padding: '1rem 1.5rem', color: 'var(--color-detail)', fontSize: '0.8rem' }}>
            {debouncedSearch || statusFilter !== 'all' ? 'No posts match.' : 'No posts yet - click + New Post to write your first one.'}
          </p>
        ) : (
          posts.map(post => {
            const isSelected = post.slug === selectedSlug
            const thumb = getThumbUrl(post)
            return (
              <Link
                key={post.id}
                href={`/blog-editor/${post.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.5rem',
                  borderRadius: 4,
                  textDecoration: 'none',
                  background: isSelected ? 'var(--color-bg-accent)' : 'transparent',
                }}
              >
                <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 3, overflow: 'hidden', background: 'var(--color-bg-accent)' }}>
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-heading)', fontFamily: 'var(--font-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.title || 'Untitled'}
                  </p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.65rem', color: 'var(--color-detail)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {post.status === 'draft' ? 'Draft' : formatDate(post.publishedAt)}
                  </p>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </aside>
  )
}
