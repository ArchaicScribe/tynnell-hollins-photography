'use client'
// Dashboard: collection counts, recent activity, OOO status.
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { type BlockedRange } from '@/app/lib/availability'

interface CollectionStat {
  slug: string
  label: string
  singularLabel: string
  emoji: string
  count: number | null
  publishedCount?: number
  addPath: string
  listPath: string
}

interface RecentPhoto {
  id: number
  url?: string | null
  alt?: string | null
  filename?: string | null
}

interface RecentPost {
  id: number
  title?: string | null
  status?: string | null
  updatedAt?: string | null
}

interface GlobalLink {
  slug: string
  label: string
  emoji: string
  path: string
}

interface OooState {
  status: 'ooo' | 'upcoming' | 'available'
  activeRange?: { label: string; start: Date; end: Date; effectiveEnd: Date }
  nextRange?: { label: string; start: Date; end: Date; effectiveEnd: Date }
}

function getEffectiveEnd(range: BlockedRange): Date {
  if (!range.endDate) return new Date(0)
  const end = new Date(range.endDate)
  const bufferDays = range.applyReturnBuffer ? (range.returnBufferDays ?? 0) : 0
  // Add buffer in UTC millis to avoid local-timezone day-boundary issues
  return new Date(end.getTime() + bufferDays * 24 * 60 * 60 * 1000)
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function computeOooState(ranges: BlockedRange[]): OooState {
  const now = new Date()
  // Normalize to start of today in UTC
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  let activeRange: OooState['activeRange'] | undefined
  let nextRange: OooState['nextRange'] | undefined

  for (const r of ranges) {
    if (!r.startDate || !r.endDate) continue
    const start = new Date(r.startDate)
    const end = new Date(r.endDate)
    const effectiveEnd = getEffectiveEnd(r)
    // End of the effective end day
    const effectiveEndDay = new Date(Date.UTC(effectiveEnd.getUTCFullYear(), effectiveEnd.getUTCMonth(), effectiveEnd.getUTCDate() + 1))

    if (todayStart >= new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) && todayStart < effectiveEndDay) {
      // Currently in this blocked range
      activeRange = { label: r.internalLabel ?? '', start, end, effectiveEnd }
    } else if (start > todayStart) {
      // Future range -- track the soonest upcoming
      if (!nextRange || start < nextRange.start) {
        nextRange = { label: r.internalLabel ?? '', start, end, effectiveEnd }
      }
    }
  }

  if (activeRange) return { status: 'ooo', activeRange, nextRange }
  if (nextRange) return { status: 'upcoming', nextRange }
  return { status: 'available' }
}

const COLLECTIONS: Omit<CollectionStat, 'count'>[] = [
  {
    slug: 'photos',
    label: 'Photos',
    singularLabel: 'Photo',
    emoji: '📷',
    addPath: '/admin/collections/photos',
    listPath: '/admin/collections/photos',
  },
  {
    slug: 'galleries',
    label: 'Galleries',
    singularLabel: 'Gallery',
    emoji: '🖼️',
    addPath: '/admin/collections/galleries/create',
    listPath: '/admin/collections/galleries',
  },
  {
    slug: 'posts',
    label: 'Blog Posts',
    singularLabel: 'Post',
    emoji: '✍️',
    addPath: '/admin/collections/posts/create',
    listPath: '/admin/collections/posts',
  },
  {
    slug: 'testimonials',
    label: 'Testimonials',
    singularLabel: 'Testimonial',
    emoji: '💬',
    addPath: '/admin/collections/testimonials/create',
    listPath: '/admin/collections/testimonials',
  },
  {
    slug: 'services',
    label: 'Services',
    singularLabel: 'Service',
    emoji: '📋',
    addPath: '/admin/collections/services/create',
    listPath: '/admin/collections/services',
  },
  {
    slug: 'users',
    label: 'Users',
    singularLabel: 'User',
    emoji: '👥',
    addPath: '/admin/collections/users/create',
    listPath: '/admin/collections/users',
  },
]

const GLOBALS: GlobalLink[] = [
  {
    slug: 'hero-slides',
    label: 'Hero Slides',
    emoji: '🎞️',
    path: '/admin/globals/hero-slides',
  },
  {
    slug: 'about-page',
    label: 'About Page',
    emoji: '👤',
    path: '/admin/globals/about-page',
  },
  {
    slug: 'site-config',
    label: 'Site Config',
    emoji: '⚙️',
    path: '/admin/globals/site-config',
  },
  {
    slug: 'booking-settings',
    label: 'Booking Settings',
    emoji: '📅',
    path: '/admin/globals/booking-settings',
  },
  {
    slug: 'availability',
    label: 'Availability / OOO',
    emoji: '🗓️',
    path: '/admin/globals/availability',
  },
]

const css = {
  wrap: {
    padding: '2rem 2.5rem',
    maxWidth: '1200px',
    fontFamily: "'Roboto Mono', monospace",
  } as React.CSSProperties,
  welcome: {
    marginBottom: '2.5rem',
  } as React.CSSProperties,
  welcomeHeading: {
    fontSize: '1.6rem',
    fontWeight: 400,
    color: '#D6D1CE',
    marginBottom: '0.4rem',
    fontFamily: "'Archivo', sans-serif",
  } as React.CSSProperties,
  welcomeSub: {
    fontSize: '0.75rem',
    color: '#9B9A9A',
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  sectionLabel: {
    fontSize: '0.62rem',
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color: '#9B9A9A',
    marginBottom: '1rem',
    marginTop: '2.5rem',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
  } as React.CSSProperties,
  card: {
    background: '#2c2c2c',
    border: '1px solid rgba(155,154,154,0.18)',
    borderRadius: '6px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  } as React.CSSProperties,
  emoji: {
    fontSize: '1.15rem',
    lineHeight: 1,
  } as React.CSSProperties,
  cardLabel: {
    fontSize: '0.78rem',
    color: '#D6D1CE',
    fontWeight: 500,
    fontFamily: "'Archivo', sans-serif",
    letterSpacing: '0.02em',
  } as React.CSSProperties,
  count: {
    fontSize: '2rem',
    fontWeight: 300,
    color: '#E6E1DE',
    lineHeight: 1,
    fontFamily: "'Archivo', sans-serif",
  } as React.CSSProperties,
  countLoading: {
    fontSize: '1.6rem',
    color: '#9B9A9A',
    fontWeight: 300,
    lineHeight: 1,
  } as React.CSSProperties,
  publishedSplit: {
    fontSize: '0.62rem',
    color: '#9B9A9A',
    fontFamily: "'Roboto Mono', monospace",
    letterSpacing: '0.03em',
    marginTop: '-0.1rem',
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  btnPrimary: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    background: '#9B9A9A',
    color: '#0C0C0C',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center' as const,
    fontFamily: "'Archivo', sans-serif",
    fontWeight: 600,
    display: 'block',
    lineHeight: '1.5',
  } as React.CSSProperties,
  btnSecondary: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    background: 'transparent',
    color: '#9B9A9A',
    border: '1px solid rgba(155,154,154,0.3)',
    borderRadius: '4px',
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center' as const,
    fontFamily: "'Archivo', sans-serif",
    fontWeight: 500,
    display: 'block',
    lineHeight: '1.5',
  } as React.CSSProperties,
  globalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '0.75rem',
  } as React.CSSProperties,
  globalCard: {
    background: '#232323',
    border: '1px solid rgba(155,154,154,0.15)',
    borderRadius: '6px',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    textDecoration: 'none',
    color: '#D6D1CE',
    fontSize: '0.75rem',
    fontFamily: "'Archivo', sans-serif",
    letterSpacing: '0.02em',
    transition: 'border-color 0.15s, background 0.15s',
  } as React.CSSProperties,
  divider: {
    height: '1px',
    background: 'rgba(155,154,154,0.1)',
    margin: '2.5rem 0 0',
  } as React.CSSProperties,
  recentSubLabel: {
    fontSize: '0.62rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'rgba(155,154,154,0.55)',
    marginBottom: '0.65rem',
    fontFamily: "'Roboto Mono', monospace",
  } as React.CSSProperties,
  photoStrip: {
    display: 'flex',
    gap: '0.4rem',
    overflowX: 'auto' as const,
    paddingBottom: '0.25rem',
  } as React.CSSProperties,
  photoThumb: {
    flexShrink: 0,
    width: '72px',
    height: '72px',
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'block',
    border: '1px solid rgba(155,154,154,0.12)',
    background: '#232323',
  } as React.CSSProperties,
  recentPostRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.55rem 0',
    borderBottom: '1px solid rgba(155,154,154,0.07)',
    textDecoration: 'none',
    color: '#D6D1CE',
    gap: '1rem',
  } as React.CSSProperties,
  recentPostTitle: {
    fontSize: '0.78rem',
    fontFamily: "'Archivo', sans-serif",
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  recentPostMeta: {
    fontSize: '0.65rem',
    color: '#9B9A9A',
    fontFamily: "'Roboto Mono', monospace",
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  } as React.CSSProperties,
  oooCard: (status: string) => ({
    padding: '1rem 1.25rem',
    borderRadius: '6px',
    border: `1px solid ${status === 'ooo' ? 'rgba(251,146,60,0.35)' : status === 'upcoming' ? 'rgba(155,154,154,0.25)' : 'rgba(74,222,128,0.25)'}`,
    background: status === 'ooo' ? 'rgba(251,146,60,0.06)' : status === 'upcoming' ? 'rgba(155,154,154,0.05)' : 'rgba(74,222,128,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap' as const,
    marginBottom: '2rem',
  }),
  oooLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  } as React.CSSProperties,
  oooStatus: (status: string) => ({
    fontSize: '0.7rem',
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
    fontFamily: "'Roboto Mono', monospace",
    color: status === 'ooo' ? '#fb923c' : status === 'upcoming' ? '#9B9A9A' : '#4ade80',
    fontWeight: 600,
  }),
  oooDetail: {
    fontSize: '0.78rem',
    color: '#D6D1CE',
    fontFamily: "'Archivo', sans-serif",
    fontWeight: 400,
  } as React.CSSProperties,
  oooSub: {
    fontSize: '0.67rem',
    color: '#9B9A9A',
    fontFamily: "'Roboto Mono', monospace",
    letterSpacing: '0.03em',
  } as React.CSSProperties,
  oooLink: {
    padding: '0.45rem 0.9rem',
    border: '1px solid rgba(155,154,154,0.3)',
    borderRadius: '4px',
    fontSize: '0.68rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#9B9A9A',
    textDecoration: 'none',
    fontFamily: "'Roboto Mono', monospace",
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  } as React.CSSProperties,
  quickUpload: {
    marginTop: '2.5rem',
    padding: '1.5rem',
    background: 'linear-gradient(135deg, #2c2c2c 0%, #232323 100%)',
    border: '1px solid rgba(155,154,154,0.2)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  quickUploadText: {
    flex: 1,
  } as React.CSSProperties,
  quickUploadHeading: {
    fontSize: '0.9rem',
    color: '#D6D1CE',
    fontFamily: "'Archivo', sans-serif",
    marginBottom: '0.3rem',
  } as React.CSSProperties,
  quickUploadSub: {
    fontSize: '0.7rem',
    color: '#9B9A9A',
  } as React.CSSProperties,
  quickUploadBtn: {
    padding: '0.65rem 1.5rem',
    background: '#9B9A9A',
    color: '#0C0C0C',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    textDecoration: 'none',
    fontFamily: "'Roboto Mono', monospace",
    whiteSpace: 'nowrap' as const,
    display: 'inline-block',
    lineHeight: '1.5',
  } as React.CSSProperties,
}

export function Dashboard() {
  const [stats, setStats] = useState<CollectionStat[]>(
    COLLECTIONS.map((c) => ({ ...c, count: null }))
  )
  const [oooState, setOooState] = useState<OooState | null>(null)
  const [recentPhotos, setRecentPhotos] = useState<RecentPhoto[]>([])
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch('/api/globals/availability?depth=0', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        const ranges: BlockedRange[] = Array.isArray(data.blockedRanges) ? data.blockedRanges : []
        setOooState(computeOooState(ranges))
      } catch {
        // Silently ignore -- OOO card is non-critical
      }
    }
    fetchAvailability()
  }, [])

  useEffect(() => {
    fetch('/api/photos?limit=8&depth=0&sort=-updatedAt', { credentials: 'include' })
      .then(r => r.json())
      .then((data: { docs?: RecentPhoto[] }) => setRecentPhotos(data.docs ?? []))
      .catch(() => { /* non-critical */ })
  }, [])

  useEffect(() => {
    fetch('/api/posts?limit=5&depth=0&sort=-updatedAt', { credentials: 'include' })
      .then(r => r.json())
      .then((data: { docs?: RecentPost[] }) => setRecentPosts(data.docs ?? []))
      .catch(() => { /* non-critical */ })
  }, [])

  useEffect(() => {
    const fetchCounts = async () => {
      const results = await Promise.allSettled(
        COLLECTIONS.map(async (col) => {
          const res = await fetch(`/api/${col.slug}?limit=0&depth=0`, {
            credentials: 'include',
          })
          if (!res.ok) return { slug: col.slug, count: 0, publishedCount: undefined }
          const data = await res.json()
          const count: number = data.totalDocs ?? 0

          // Fetch a sub-count for certain collections to surface on the dashboard card
          if (col.slug === 'posts') {
            // Posts: published vs. draft split
            const pubRes = await fetch(
              '/api/posts?limit=0&depth=0&where[status][equals]=published',
              { credentials: 'include' },
            )
            const publishedCount = pubRes.ok
              ? ((await pubRes.json()).totalDocs ?? 0)
              : undefined
            return { slug: col.slug, count, publishedCount }
          }

          if (col.slug === 'photos' || col.slug === 'galleries' || col.slug === 'testimonials') {
            // Featured (or on-homepage) count
            const featRes = await fetch(
              `/api/${col.slug}?limit=0&depth=0&where[featured][equals]=true`,
              { credentials: 'include' },
            )
            const publishedCount = featRes.ok
              ? ((await featRes.json()).totalDocs ?? 0)
              : undefined
            return { slug: col.slug, count, publishedCount }
          }

          return { slug: col.slug, count, publishedCount: undefined }
        })
      )
      setStats((prev) =>
        prev.map((col, i) => {
          const result = results[i]
          if (result.status === 'fulfilled') {
            return { ...col, count: result.value.count, publishedCount: result.value.publishedCount }
          }
          return { ...col, count: 0 }
        })
      )
    }
    fetchCounts()
  }, [])

  return (
    <div style={css.wrap}>
      {/* Welcome */}
      <div style={css.welcome}>
        <h1 style={css.welcomeHeading}>Tynnell Hollins Photography</h1>
        <p style={css.welcomeSub}>Studio Dashboard</p>
      </div>

      {/* OOO Status Card */}
      {oooState && (() => {
        const { status, activeRange, nextRange } = oooState
        if (status === 'ooo' && activeRange) {
          const returnsLabel = `Returns ${fmtDate(activeRange.effectiveEnd)}`
          const rangeLabel = `${fmtDate(activeRange.start)} - ${fmtDate(activeRange.end)}`
          return (
            <div style={css.oooCard(status)}>
              <div style={css.oooLeft}>
                <span style={css.oooStatus(status)}>Out of Office</span>
                <span style={css.oooDetail}>{activeRange.label || rangeLabel}</span>
                <span style={css.oooSub}>{activeRange.label ? rangeLabel + ' ' : ''}{returnsLabel}</span>
              </div>
              <Link href="/admin/globals/availability" style={css.oooLink}>Edit Availability</Link>
            </div>
          )
        }
        if (status === 'upcoming' && nextRange) {
          const rangeLabel = `${fmtDate(nextRange.start)} - ${fmtDate(nextRange.effectiveEnd)}`
          return (
            <div style={css.oooCard(status)}>
              <div style={css.oooLeft}>
                <span style={css.oooStatus(status)}>Next Unavailable</span>
                <span style={css.oooDetail}>{rangeLabel}{nextRange.label ? ` (${nextRange.label})` : ''}</span>
              </div>
              <Link href="/admin/globals/availability" style={css.oooLink}>Edit Availability</Link>
            </div>
          )
        }
        // Available
        return (
          <div style={css.oooCard(status)}>
            <div style={css.oooLeft}>
              <span style={css.oooStatus(status)}>Available for Bookings</span>
              <span style={css.oooSub}>No blocked dates set.</span>
            </div>
            <Link href="/admin/globals/availability" style={css.oooLink}>Edit Availability</Link>
          </div>
        )
      })()}

      {/* Quick Upload CTA */}
      <div style={css.quickUpload}>
        <div style={css.quickUploadText}>
          <p style={css.quickUploadHeading}>Ready to add new photos?</p>
          <p style={css.quickUploadSub}>Drag and drop images to bulk upload in one go.</p>
        </div>
        <Link href="/admin/collections/photos" style={css.quickUploadBtn}>
          Upload Photos
        </Link>
      </div>

      {/* Page Builder CTA */}
      <div style={css.quickUpload}>
        <div style={css.quickUploadText}>
          <p style={css.quickUploadHeading}>Build a page</p>
          <p style={css.quickUploadSub}>Design pages visually with drag-and-drop sections.</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- cross root-layout: hard nav avoids the RSC-payload fetch error */}
        <a href="/builder" style={css.quickUploadBtn}>
          Open Page Builder
        </a>
      </div>

      {/* Collections */}
      <p style={css.sectionLabel}>Collections</p>
      <div style={css.grid}>
        {stats.map((col) => (
          <div key={col.slug} style={css.card}>
            <div style={css.cardHeader}>
              <span style={css.emoji} aria-hidden="true">{col.emoji}</span>
              <span style={css.cardLabel}>{col.label}</span>
            </div>
            {col.count === null ? (
              <span style={css.countLoading} aria-label="Loading">...</span>
            ) : (
              <>
                <span style={css.count}>{col.count}</span>
                {col.publishedCount !== undefined && col.count > 0 && (
                  <span style={css.publishedSplit}>
                    {col.slug === 'posts'
                      ? `${col.publishedCount} published · ${col.count - col.publishedCount} draft${col.count - col.publishedCount !== 1 ? 's' : ''}`
                      : col.slug === 'testimonials'
                        ? `${col.publishedCount} on homepage`
                        : `${col.publishedCount} featured`}
                  </span>
                )}
              </>
            )}
            <div style={css.actions}>
              <Link href={col.addPath} style={css.btnPrimary}>
                + Add
              </Link>
              <Link href={col.listPath} style={css.btnSecondary}>
                View All
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Globals */}
      <p style={css.sectionLabel}>Site Globals</p>
      <div style={css.globalGrid}>
        {GLOBALS.map((g) => (
          <Link key={g.slug} href={g.path} style={css.globalCard}>
            <span style={css.emoji} aria-hidden="true">{g.emoji}</span>
            <span>{g.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      {(recentPhotos.length > 0 || recentPosts.length > 0) && (
        <>
          <p style={css.sectionLabel}>Recent Activity</p>

          {recentPhotos.length > 0 && (
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={css.recentSubLabel}>Recent Photos</div>
              <div style={css.photoStrip}>
                {recentPhotos.map(photo => (
                  <Link
                    key={photo.id}
                    href={`/admin/collections/photos/${photo.id}`}
                    style={css.photoThumb}
                    aria-label={photo.alt ?? photo.filename ?? `Photo ${photo.id}`}
                    title={photo.alt ?? photo.filename ?? `Photo ${photo.id}`}
                  >
                    {photo.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.url}
                        alt=""
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div aria-hidden="true" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#444' }}>
                        &#128247;
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {recentPosts.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={css.recentSubLabel}>Recent Posts</div>
              {recentPosts.map(post => (
                <Link
                  key={post.id}
                  href={`/admin/collections/posts/${post.id}`}
                  style={css.recentPostRow}
                  className="recent-post-row"
                >
                  <span style={css.recentPostTitle}>{post.title ?? 'Untitled'}</span>
                  <span style={css.recentPostMeta}>
                    {post.status ?? 'draft'}
                    {post.updatedAt ? ` · ${fmtDate(new Date(post.updatedAt))}` : ''}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <div style={css.divider} />
    </div>
  )
}
