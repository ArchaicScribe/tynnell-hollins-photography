'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'

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

interface GlobalLink {
  slug: string
  label: string
  emoji: string
  path: string
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

          // Fetch published count separately for posts so the card can show the published vs draft split
          if (col.slug === 'posts') {
            const pubRes = await fetch(
              '/api/posts?limit=0&depth=0&where[status][equals]=published',
              { credentials: 'include' },
            )
            const publishedCount = pubRes.ok
              ? ((await pubRes.json()).totalDocs ?? 0)
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

      {/* Collections */}
      <p style={css.sectionLabel}>Collections</p>
      <div style={css.grid}>
        {stats.map((col) => (
          <div key={col.slug} style={css.card}>
            <div style={css.cardHeader}>
              <span style={css.emoji}>{col.emoji}</span>
              <span style={css.cardLabel}>{col.label}</span>
            </div>
            {col.count === null ? (
              <span style={css.countLoading}>...</span>
            ) : (
              <>
                <span style={css.count}>{col.count}</span>
                {col.publishedCount !== undefined && col.count > 0 && (
                  <span style={css.publishedSplit}>
                    {col.publishedCount} published
                    {' · '}
                    {col.count - col.publishedCount} draft{col.count - col.publishedCount !== 1 ? 's' : ''}
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
            <span style={css.emoji}>{g.emoji}</span>
            <span>{g.label}</span>
          </Link>
        ))}
      </div>

      <div style={css.divider} />
    </div>
  )
}
