'use client'
import { useState, useRef, useEffect } from 'react'

const ui = "var(--font-heading, Archivo, sans-serif)"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Gallery {
  id: number
  title: string
  slug: string | null
  status: string
  photoCount?: number
  coverPhoto?: { url?: string; filename?: string } | null
}

interface Photo {
  id: number
  filename: string
  url?: string
  width?: number
  height?: number
  updatedAt: string
}

interface Props {
  userName: string
  galleries: Gallery[]
  photos: Photo[]
}

// ---------------------------------------------------------------------------
// Product card definitions (Pixieset structure mapped to our stack)
// ---------------------------------------------------------------------------

interface ProductLink {
  label: string
  href: string
  external?: boolean
}

interface Product {
  label: string
  color: string
  icon: React.ReactNode
  links: ProductLink[]
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function PortfolioIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="2" y="6" width="24" height="18" rx="2.5" stroke="white" strokeWidth="1.8" />
      <path d="M2 11h24" stroke="white" strokeWidth="1.8" />
      <circle cx="8" cy="8.5" r="1.5" fill="white" />
      <circle cx="14" cy="8.5" r="1.5" fill="white" />
    </svg>
  )
}

function WebsiteIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="11" stroke="white" strokeWidth="1.8" />
      <path d="M14 3C14 3 10 8 10 14s4 11 4 11M14 3c0 0 4 5 4 11s-4 11-4 11M3 14h22" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function StudioIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="10" r="5" stroke="white" strokeWidth="1.8" />
      <path d="M4 24c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BlogIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="22" height="22" rx="2.5" stroke="white" strokeWidth="1.8" />
      <path d="M8 9h12M8 14h12M8 19h7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ExternalArrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ marginLeft: 3, opacity: 0.5, flexShrink: 0 }}>
      <path d="M2 8L8 2M8 2H4M8 2v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2a5 5 0 0 1 5 5v3l1.5 2.5H2.5L4 10V7a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M7 15a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Top bar
// ---------------------------------------------------------------------------

function TopBar({ userName }: { userName: string }) {
  const initials = userName.includes('@')
    ? userName[0].toUpperCase()
    : userName.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', height: 56, background: '#111',
      borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
    }}>
      {/* Left: logo + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 6,
            background: 'linear-gradient(135deg,#1db48e,#0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: '#fff', fontFamily: ui, letterSpacing: '0.02em',
          }}>TH</div>
        </div>

        <button
          type="button"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: '#e6e1de',
          }}
        >
          <span style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: ui }}>Dashboard</span>
          <ChevronDownIcon />
        </button>
      </div>

      {/* Right: bell + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          aria-label="Notifications"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b9a9a', display: 'flex', alignItems: 'center', padding: '0.3rem' }}
        >
          <BellIcon />
        </button>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="User menu"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg,#1db48e,#0d9488)',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: '#fff', fontFamily: ui,
            }}
          >
            {initials}
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '0.35rem', minWidth: 160,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 100,
            }}>
              <div style={{ padding: '0.4rem 0.75rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '0.3rem' }}>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#5a5a5a', fontFamily: ui }}>Signed in as</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#9b9a9a', fontFamily: ui, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/admin/logout" style={{ display: 'block', padding: '0.45rem 0.75rem', borderRadius: 5, textDecoration: 'none', color: '#9b9a9a', fontSize: '0.82rem', fontFamily: ui }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#e6e1de' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
              >
                Sign out
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Product card
// ---------------------------------------------------------------------------

function ProductCard({ product }: { product: Product }) {
  return (
    <div style={{
      padding: '1.25rem 1rem 1.25rem 0',
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      {/* Icon */}
      <div style={{
        width: 54, height: 54, borderRadius: '50%',
        background: product.color, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: '0.9rem', flexShrink: 0,
      }}>
        {product.icon}
      </div>

      {/* Label */}
      <p style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700, color: '#e6e1de', fontFamily: ui }}>
        {product.label}
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0 0 0.75rem' }} />

      {/* Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
        {product.links.map(link => (
          link.href === '#coming-soon' ? (
            <span
              key={link.label}
              style={{ display: 'inline-flex', alignItems: 'center', padding: '0.35rem 0', fontSize: '0.84rem', color: '#3a3a3a', fontFamily: ui, cursor: 'not-allowed' }}
            >
              {link.label}
            </span>
          ) : link.external ? (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', padding: '0.35rem 0', fontSize: '0.84rem', color: '#9b9a9a', fontFamily: ui, textDecoration: 'none', transition: 'color 0.1s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e6e1de' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
            >
              {link.label}
              <ExternalArrow />
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a
              key={link.label}
              href={link.href}
              style={{ display: 'inline-flex', alignItems: 'center', padding: '0.35rem 0', fontSize: '0.84rem', color: '#9b9a9a', fontFamily: ui, textDecoration: 'none', transition: 'color 0.1s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e6e1de' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
            >
              {link.label}
            </a>
          )
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quick access - recent collections
// ---------------------------------------------------------------------------

function RecentCollections({ galleries }: { galleries: Gallery[] }) {
  const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? 'https://pub-db2dd9a6665142e4adcd4f822fbe2683.r2.dev'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1db48e' }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#5a5a5a', fontFamily: ui, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Recent Collections
        </span>
      </div>

      {galleries.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.83rem', color: '#3a3a3a', fontFamily: ui }}>No collections yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {galleries.slice(0, 5).map(g => {
            const thumb = g.coverPhoto?.url ?? (g.coverPhoto?.filename ? `${R2_BASE}/${g.coverPhoto.filename}` : null)
            return (
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a
                key={g.id}
                href="/gallery-editor"
                style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                <div style={{
                  width: 52, height: 38, borderRadius: 5, overflow: 'hidden', flexShrink: 0,
                  background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1rem' }}>📷</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: '#d6d1ce', fontFamily: ui, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {g.title}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#5a5a5a', fontFamily: ui }}>
                    {g.photoCount ?? 0} photos
                  </p>
                </div>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 600, color: g.status === 'published' ? '#4ade80' : '#9b9a9a',
                  fontFamily: ui, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0,
                }}>
                  {g.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </a>
            )
          })}
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/gallery-editor"
        style={{ display: 'inline-block', marginTop: '0.85rem', fontSize: '0.78rem', color: '#1db48e', fontFamily: ui, textDecoration: 'none' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
      >
        View all collections
      </a>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quick access - recent photos
// ---------------------------------------------------------------------------

function RecentPhotos({ photos }: { photos: Photo[] }) {
  const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? 'https://pub-db2dd9a6665142e4adcd4f822fbe2683.r2.dev'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#b45309' }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#5a5a5a', fontFamily: ui, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Recent Uploads
        </span>
      </div>

      {photos.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.83rem', color: '#3a3a3a', fontFamily: ui }}>No photos yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          {photos.slice(0, 8).map(p => {
            const src = p.url ?? `${R2_BASE}/${p.filename}`
            return (
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a
                key={p.id}
                href="/photo-library"
                style={{ display: 'block', borderRadius: 6, overflow: 'hidden', background: '#222', aspectRatio: '1', textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </a>
            )
          })}
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/photo-library"
        style={{ display: 'inline-block', marginTop: '0.85rem', fontSize: '0.78rem', color: '#b45309', fontFamily: ui, textDecoration: 'none' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
      >
        View photo library
      </a>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function StudioClient({ userName, galleries, photos }: Props) {
  const PRODUCTS: Product[] = [
    {
      label: 'Portfolio',
      color: '#0d9488',
      icon: <PortfolioIcon />,
      links: [
        { label: 'Manage Collections', href: '/gallery-editor' },
        { label: 'Create Collection', href: '/gallery-editor?new=1' },
        { label: 'Search Photo Library', href: '/photo-library' },
        { label: 'View Portfolio', href: 'https://tynnellhollinsphotography.com/portfolio', external: true },
      ],
    },
    {
      label: 'Website',
      color: '#2563eb',
      icon: <WebsiteIcon />,
      links: [
        { label: 'Edit Website', href: '/builder' },
        { label: 'Availability / OOO', href: '/availability' },
        { label: 'View Website', href: 'https://tynnellhollinsphotography.com', external: true },
      ],
    },
    {
      label: 'Studio Manager',
      color: '#059669',
      icon: <StudioIcon />,
      links: [
        { label: 'Manage Contacts', href: '#coming-soon' },
        { label: 'New Project', href: '#coming-soon' },
        { label: 'New Session', href: '#coming-soon' },
        { label: 'View Payments', href: '#coming-soon' },
      ],
    },
    {
      label: 'Blog',
      color: '#7c3aed',
      icon: <BlogIcon />,
      links: [
        { label: 'All Posts', href: '/admin/collections/posts' },
        { label: 'New Post', href: '/admin/collections/posts/create' },
        { label: 'View Blog', href: 'https://tynnellhollinsphotography.com/blog', external: true },
      ],
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', flexDirection: 'column' }}>
      <TopBar userName={userName} />

      <main style={{ flex: 1, padding: '2.5rem 2rem', maxWidth: 1200, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        <h1 style={{ margin: '0 0 2rem', fontSize: '1.75rem', fontWeight: 700, color: '#e6e1de', fontFamily: ui }}>
          Dashboard
        </h1>

        {/* PRODUCTS */}
        <p style={{ margin: '0 0 1rem', fontSize: '0.7rem', fontWeight: 600, color: '#3a3a3a', fontFamily: ui, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Products
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0',
          marginBottom: '3rem',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: '1.75rem',
        }}>
          {PRODUCTS.map(p => <ProductCard key={p.label} product={p} />)}
        </div>

        {/* QUICK ACCESS */}
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.7rem', fontWeight: 600, color: '#3a3a3a', fontFamily: ui, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Quick Access
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.25rem 1.5rem' }}>
            <RecentCollections galleries={galleries} />
          </div>
          <div style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.25rem 1.5rem' }}>
            <RecentPhotos photos={photos} />
          </div>
        </div>

      </main>
    </div>
  )
}
