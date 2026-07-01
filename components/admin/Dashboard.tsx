'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { type BlockedRange } from '@/app/lib/availability'
import { InviteUserModal } from './InviteUserModal'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecentPhoto { id: number; url?: string | null; alt?: string | null; filename?: string | null }
interface RecentGallery { id: number; title?: string | null; status?: string | null; updatedAt?: string | null; coverPhoto?: { url?: string | null } | null; photos?: unknown[] }
interface RecentOrder { id: string; orderNum: string; status: string; customer: string; date: string; amount: string | null }

interface OooState {
  status: 'ooo' | 'upcoming' | 'available'
  activeRange?: { label: string; start: Date; end: Date; effectiveEnd: Date }
  nextRange?: { label: string; start: Date; end: Date; effectiveEnd: Date }
}

// ---------------------------------------------------------------------------
// OOO helpers
// ---------------------------------------------------------------------------

function getEffectiveEnd(range: BlockedRange): Date {
  if (!range.endDate) return new Date(0)
  const end = new Date(range.endDate)
  const bufferDays = range.applyReturnBuffer ? (range.returnBufferDays ?? 0) : 0
  return new Date(end.getTime() + bufferDays * 24 * 60 * 60 * 1000)
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function fmtLongDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })
  const day = d.getUTCDate()
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'
  return `${month} ${day}${suffix}, ${year(dateStr)}`
}

function year(dateStr: string): number {
  return new Date(dateStr).getUTCFullYear()
}

function computeOooState(ranges: BlockedRange[]): OooState {
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  let activeRange: OooState['activeRange'] | undefined
  let nextRange: OooState['nextRange'] | undefined
  for (const r of ranges) {
    if (!r.startDate || !r.endDate) continue
    const start = new Date(r.startDate)
    const end = new Date(r.endDate)
    const effectiveEnd = getEffectiveEnd(r)
    const endDay = new Date(Date.UTC(effectiveEnd.getUTCFullYear(), effectiveEnd.getUTCMonth(), effectiveEnd.getUTCDate() + 1))
    if (todayStart >= new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) && todayStart < endDay) {
      activeRange = { label: r.internalLabel ?? '', start, end, effectiveEnd }
    } else if (start > todayStart) {
      if (!nextRange || start < nextRange.start) nextRange = { label: r.internalLabel ?? '', start, end, effectiveEnd }
    }
  }
  if (activeRange) return { status: 'ooo', activeRange, nextRange }
  if (nextRange) return { status: 'upcoming', nextRange }
  return { status: 'available' }
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ---------------------------------------------------------------------------
// Product definitions
// ---------------------------------------------------------------------------

const ui = "'Archivo', sans-serif"

interface ProductLink { label: string; href: string; external?: boolean }
interface Product { id: string; label: string; color: string; icon: React.ReactNode; links: ProductLink[] }

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="2" y="6" width="24" height="18" rx="2.5" stroke="white" strokeWidth="1.8" />
      <path d="M2 11h24" stroke="white" strokeWidth="1.8" />
      <circle cx="8" cy="8.5" r="1.5" fill="white" />
      <circle cx="14" cy="8.5" r="1.5" fill="white" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="11" stroke="white" strokeWidth="1.8" />
      <path d="M14 3c0 0-4 5-4 11s4 11 4 11M14 3c0 0 4 5 4 11s-4 11-4 11M3 14h22" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function PenIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="22" height="22" rx="2.5" stroke="white" strokeWidth="1.8" />
      <path d="M8 9h12M8 14h12M8 19h7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="10" r="5" stroke="white" strokeWidth="1.8" />
      <path d="M4 24c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
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

const PRODUCTS: Product[] = [
  {
    id: 'portfolio',
    label: 'Portfolio',
    color: '#0d9488',
    icon: <CameraIcon />,
    links: [
      { label: 'Manage Collections', href: '/builder?product=portfolio' },
      { label: 'Create Collection', href: '/builder?product=portfolio' },
      { label: 'Photo Library', href: '/admin/collections/photos' },
      { label: 'View Portfolio', href: 'https://tynnellhollinsphotography.com/portfolio', external: true },
    ],
  },
  {
    id: 'website',
    label: 'Website',
    color: '#2563eb',
    icon: <GlobeIcon />,
    links: [
      { label: 'Edit Website', href: '/builder' },
      { label: 'Hero Slides', href: '/admin/globals/hero-slides' },
      { label: 'About Page', href: '/admin/globals/about-page' },
      { label: 'Availability / OOO', href: '/availability' },
      { label: 'View Website', href: 'https://tynnellhollinsphotography.com', external: true },
    ],
  },
  {
    id: 'blog',
    label: 'Blog',
    color: '#7c3aed',
    icon: <PenIcon />,
    links: [
      { label: 'All Posts', href: '/admin/collections/posts' },
      { label: 'New Post', href: '/admin/collections/posts/create' },
      { label: 'View Blog', href: 'https://tynnellhollinsphotography.com/blog', external: true },
    ],
  },
  {
    id: 'studio',
    label: 'Studio',
    color: '#475569',
    icon: <UsersIcon />,
    links: [
      { label: 'Users', href: '/admin/collections/users' },
      { label: 'Site Config', href: '/admin/globals/site-config' },
      { label: 'Page Builder', href: '/builder' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProductCard({ product }: { product: Product & { extra?: React.ReactNode } }) {
  return (
    <div style={{
      background: '#161616',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '1.5rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      <div style={{
        width: 54, height: 54, borderRadius: '50%',
        background: product.color, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: '0.9rem', flexShrink: 0,
      }}>
        {product.icon}
      </div>

      <p style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700, color: '#e6e1de', fontFamily: ui }}>
        {product.label}
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0 0 0.75rem' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
        {product.links.map(link =>
          link.external ? (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
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
              style={linkStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e6e1de' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
            >
              {link.label}
            </a>
          )
        )}
        {product.extra}
      </div>
    </div>
  )
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.35rem 0',
  fontSize: '0.84rem',
  color: '#9b9a9a',
  textDecoration: 'none',
  fontFamily: ui,
  transition: 'color 0.1s',
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function Dashboard() {
  const [oooState, setOooState] = useState<OooState | null>(null)
  const [oooError, setOooError] = useState(false)
  const [recentPhotos, setRecentPhotos] = useState<RecentPhoto[]>([])
  const [recentGalleries, setRecentGalleries] = useState<RecentGallery[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [ordersLoaded, setOrdersLoaded] = useState(false)
  const [firstName, setFirstName] = useState('Tynnell')

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((d: { user?: { name?: string; email?: string } } | null) => {
        const name = d?.user?.name
        if (name) setFirstName(name.split(' ')[0])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/globals/availability?depth=0', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then(data => {
        const ranges: BlockedRange[] = Array.isArray(data?.blockedRanges) ? data.blockedRanges : []
        setOooState(computeOooState(ranges))
      })
      .catch(() => setOooError(true))
  }, [])

  useEffect(() => {
    fetch('/api/photos?limit=8&depth=0&sort=-updatedAt', { credentials: 'include' })
      .then(r => r.json())
      .then((d: { docs?: RecentPhoto[] }) => setRecentPhotos(d.docs ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/galleries?limit=5&depth=1&sort=-updatedAt', { credentials: 'include' })
      .then(r => r.json())
      .then((d: { docs?: RecentGallery[] }) => setRecentGalleries(d.docs ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/admin/recent-orders', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { orders: [] })
      .then((d: { orders?: RecentOrder[] }) => setRecentOrders(d.orders ?? []))
      .catch(() => {})
      .finally(() => setOrdersLoaded(true))
  }, [])

  const oooPillColor = oooState?.status === 'ooo' ? '#fb923c' : oooState?.status === 'upcoming' ? '#9B9A9A' : '#4ade80'
  const oooPillLabel = oooState?.status === 'ooo'
    ? `Out of Office - returns ${fmtDate(oooState.activeRange!.effectiveEnd)}`
    : oooState?.status === 'upcoming'
    ? `Next unavailable ${fmtDate(oooState.nextRange!.start)}`
    : 'Available for Bookings'

  return (
    <div style={{ minHeight: '100vh', background: '#111', padding: '2.5rem 2rem', fontFamily: ui, boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.75rem', fontWeight: 700, color: '#e6e1de', fontFamily: ui }}>
            {getGreeting()}, {firstName}
          </h1>
          {oooError && (
            <span
              role="alert"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.9rem',
                borderRadius: '999px',
                border: '1px solid rgba(248,113,113,0.27)',
                background: 'rgba(248,113,113,0.07)',
                fontSize: '0.7rem',
                color: '#f0a3a3',
                fontFamily: "'Roboto Mono', monospace",
                letterSpacing: '0.04em',
              }}
            >
              Couldn&apos;t check availability status
            </span>
          )}
          {oooState && (
            <Link
              href="/availability"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.9rem',
                borderRadius: '999px',
                border: `1px solid ${oooPillColor}44`,
                background: `${oooPillColor}11`,
                fontSize: '0.7rem',
                color: oooPillColor,
                textDecoration: 'none',
                fontFamily: "'Roboto Mono', monospace",
                letterSpacing: '0.04em',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: oooPillColor, flexShrink: 0 }} />
              {oooPillLabel}
            </Link>
          )}
        </div>

        {/* Products */}
        <p style={sectionLabel}>Products</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.85rem',
          marginBottom: '3rem',
        }}>
          {PRODUCTS.map(p => (
            <ProductCard key={p.id} product={p.id === 'studio' ? { ...p, extra: <InviteUserModal /> } : p} />
          ))}
        </div>

        {/* Quick Access */}
        <p style={sectionLabel}>Quick Access</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: ordersLoaded && recentOrders.length > 0 ? '3rem' : 0 }}>

          {/* Recent Collections */}
          <div style={quickCardStyle}>
            <SectionDot color="#1db48e" label="Recent Collections" />
            {recentGalleries.length === 0 ? (
              <p style={emptyText}>No collections yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {recentGalleries.map((g, i) => {
                  const photoCount = Array.isArray(g.photos) ? g.photos.length : 0
                  const isPublished = g.status !== 'draft'
                  return (
                    // eslint-disable-next-line @next/next/no-html-link-for-pages
                    <a
                      key={g.id}
                      href={`/gallery-editor/${g.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.85rem',
                        textDecoration: 'none', padding: '0.4rem 0',
                        borderBottom: i < recentGalleries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                    >
                      <div style={{ width: 52, height: 38, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {g.coverPhoto?.url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={g.coverPhoto.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '1rem' }} aria-hidden="true">📷</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: '#d6d1ce', fontFamily: ui, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {g.title ?? 'Untitled'}
                        </p>
                        <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#5a5a5a', fontFamily: ui }}>
                          {photoCount} photo{photoCount !== 1 ? 's' : ''}{g.updatedAt ? ` · ${fmtLongDate(g.updatedAt)}` : ''}
                        </p>
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: isPublished ? '#4ade80' : '#9b9a9a', fontFamily: ui, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>
                        {isPublished ? 'Live' : 'Draft'}
                      </span>
                    </a>
                  )
                })}
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/gallery-editor" style={footerLink('#1db48e')}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
            >
              View all collections
            </a>
          </div>

          {/* Recent Photos */}
          <div style={quickCardStyle}>
            <SectionDot color="#b45309" label="Recent Uploads" />
            {recentPhotos.length === 0 ? (
              <p style={emptyText}>No photos yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {recentPhotos.map(photo => (
                  <Link
                    key={photo.id}
                    href={`/admin/collections/photos/${photo.id}`}
                    style={{ display: 'block', borderRadius: 6, overflow: 'hidden', background: '#222', aspectRatio: '1', textDecoration: 'none' }}
                    aria-label={photo.alt ?? photo.filename ?? `Photo ${photo.id}`}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                  >
                    {photo.url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={photo.url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div aria-hidden="true" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#333' }}>📷</div>
                    }
                  </Link>
                ))}
              </div>
            )}
            <Link href="/admin/collections/photos" style={footerLink('#b45309')}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
            >
              View photo library
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        {ordersLoaded && recentOrders.length > 0 && (
          <>
            <p style={sectionLabel}>Recent Orders</p>
            <div style={quickCardStyle}>
              <SectionDot color="#b45309" label="Orders" />
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Order', 'Status', 'Customer', 'Date', 'Amount'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{ ...tdStyle, fontFamily: "'Roboto Mono', monospace", fontSize: '0.72rem', color: '#9b9a9a' }}>{o.orderNum}</td>
                      <td style={tdStyle}><span style={{ fontSize: '0.65rem', color: '#4ade80', fontFamily: "'Roboto Mono', monospace" }}>{o.status}</span></td>
                      <td style={{ ...tdStyle, color: '#d6d1ce', fontSize: '0.84rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer}</td>
                      <td style={{ ...tdStyle, color: '#5a5a5a', fontFamily: "'Roboto Mono', monospace", fontSize: '0.68rem', whiteSpace: 'nowrap' }}>{o.date}</td>
                      <td style={{ ...tdStyle, color: '#9b9a9a', fontFamily: "'Roboto Mono', monospace", fontSize: '0.72rem' }}>{o.amount ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

function SectionDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#5a5a5a', fontFamily: ui, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  margin: '0 0 1rem',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: '#3a3a3a',
  fontFamily: ui,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

const quickCardStyle: React.CSSProperties = {
  background: '#161616',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 10,
  padding: '1.25rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
}

const emptyText: React.CSSProperties = {
  margin: 0,
  fontSize: '0.83rem',
  color: '#3a3a3a',
  fontFamily: ui,
}

function footerLink(color: string): React.CSSProperties {
  return {
    display: 'inline-block',
    marginTop: '0.25rem',
    fontSize: '0.78rem',
    color,
    fontFamily: ui,
    textDecoration: 'none',
  }
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: '0.62rem',
  letterSpacing: '0.08em',
  color: '#5a5a5a',
  fontFamily: ui,
  paddingBottom: '0.5rem',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  fontWeight: 600,
}

const tdStyle: React.CSSProperties = {
  padding: '0.55rem 0.5rem 0.55rem 0',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  verticalAlign: 'middle',
  color: '#d6d1ce',
  fontSize: '0.84rem',
  fontFamily: ui,
}
