'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { type BlockedRange } from '@/app/lib/availability'

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
  const year = d.getUTCFullYear()
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'
  return `${month} ${day}${suffix}, ${year}`
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

// ---------------------------------------------------------------------------
// Product definitions
// ---------------------------------------------------------------------------

interface Product {
  id: string
  label: string
  color: string
  icon: React.ReactNode
  links: { label: string; href: string; external?: boolean }[]
}

function CameraIcon() {
  return (
    <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
      <path d="M10 3H18L20.5 7H25C26.1 7 27 7.9 27 9V21C27 22.1 26.1 23 25 23H3C1.9 23 1 22.1 1 21V9C1 7.9 1.9 7 3 7H7.5L10 3Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
      <circle cx="14" cy="15" r="4.5" stroke="white" strokeWidth="1.6"/>
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="11" stroke="white" strokeWidth="1.6"/>
      <path d="M13 2C13 2 9 7 9 13C9 19 13 24 13 24M13 2C13 2 17 7 17 13C17 19 13 24 13 24M2 13H24" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}

function PenIcon() {
  return (
    <svg width="24" height="26" viewBox="0 0 24 26" fill="none">
      <path d="M16 3L21 8L8 21L2 23L4 17L16 3Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M14 5L19 10" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="2" y="4" width="22" height="20" rx="2.5" stroke="white" strokeWidth="1.6"/>
      <path d="M2 10H24M8 2V6M18 2V6" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <rect x="6" y="14" width="3" height="3" rx="0.5" fill="white"/>
      <rect x="11.5" y="14" width="3" height="3" rx="0.5" fill="white"/>
      <rect x="17" y="14" width="3" height="3" rx="0.5" fill="white"/>
    </svg>
  )
}

function QuoteIcon() {
  return (
    <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
      <path d="M2 2H12V12H7C7 14.5 8.5 16 11 16V20C5 20 2 17 2 12V2Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M16 2H26V12H21C21 14.5 22.5 16 25 16V20C19 20 16 17 16 12V2Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
      <circle cx="10" cy="8" r="5" stroke="white" strokeWidth="1.6"/>
      <path d="M1 22C1 17.6 5 14 10 14C15 14 19 17.6 19 22" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M20 10C21.7 10 23 8.7 23 7C23 5.3 21.7 4 20 4" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M20 13C23.3 13 27 15.1 27 19" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
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
      { label: 'Manage Collections', href: '/admin/collections/galleries' },
      { label: 'New Collection', href: '/admin/collections/galleries/create' },
      { label: 'Photo Library', href: '/admin/collections/photos' },
      { label: 'Portfolio Editor', href: '/gallery-editor', external: true },
      { label: 'View Portfolio', href: 'https://tynnellhollinsphotography.com/portfolio', external: true },
    ],
  },
  {
    id: 'website',
    label: 'Website',
    color: '#2563eb',
    icon: <GlobeIcon />,
    links: [
      { label: 'Website Editor', href: '/builder', external: true },
      { label: 'Hero Slides', href: '/admin/globals/hero-slides' },
      { label: 'About Page', href: '/admin/globals/about-page' },
      { label: 'Site Config', href: '/admin/globals/site-config' },
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
    id: 'bookings',
    label: 'Bookings',
    color: '#b45309',
    icon: <CalendarIcon />,
    links: [
      { label: 'Services', href: '/admin/collections/services' },
      { label: 'New Service', href: '/admin/collections/services/create' },
      { label: 'Booking Settings', href: '/admin/globals/booking-settings' },
      { label: 'Availability / OOO', href: '/admin/globals/availability' },
    ],
  },
  {
    id: 'testimonials',
    label: 'Testimonials',
    color: '#059669',
    icon: <QuoteIcon />,
    links: [
      { label: 'All Testimonials', href: '/admin/collections/testimonials' },
      { label: 'New Testimonial', href: '/admin/collections/testimonials/create' },
      { label: 'View Testimonials', href: 'https://tynnellhollinsphotography.com/testimonials', external: true },
    ],
  },
  {
    id: 'studio',
    label: 'Studio',
    color: '#475569',
    icon: <UsersIcon />,
    links: [
      { label: 'Users', href: '/admin/collections/users' },
      { label: 'Page Builder', href: '/builder', external: true },
    ],
  },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ExternalArrow() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ opacity: 0.35, flexShrink: 0 }}>
      <path d="M2 8L8 2M8 2H4.5M8 2V5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '8px',
      padding: '1.5rem 1.5rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      {/* Icon circle */}
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: product.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        flexShrink: 0,
      }}>
        {product.icon}
      </div>

      {/* Section name + divider */}
      <p style={{
        fontSize: '1rem',
        fontWeight: 600,
        color: '#E6E1DE',
        fontFamily: "'Archivo', sans-serif",
        marginBottom: '0.65rem',
        paddingBottom: '0.65rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {product.label}
      </p>

      {/* Sub-links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
        {product.links.map(link => {
          const isHttp = link.href.startsWith('http')
          if (link.external) {
            return (
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#E6E1DE' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '' }}
              >
                {link.label}
                <ExternalArrow />
              </a>
            )
          }
          return (
            <Link
              key={link.label}
              href={link.href}
              style={linkStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#E6E1DE' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '' }}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

const linkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.3rem 0',
  fontSize: '0.8rem',
  color: '#8A8480',
  textDecoration: 'none',
  fontFamily: "'Archivo', sans-serif",
  transition: 'color 0.1s',
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function Dashboard() {
  const [oooState, setOooState] = useState<OooState | null>(null)
  const [recentPhotos, setRecentPhotos] = useState<RecentPhoto[]>([])
  const [recentGalleries, setRecentGalleries] = useState<RecentGallery[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [ordersLoaded, setOrdersLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/globals/availability?depth=0', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        const ranges: BlockedRange[] = Array.isArray(data.blockedRanges) ? data.blockedRanges : []
        setOooState(computeOooState(ranges))
      })
      .catch(() => {})
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
    <div style={{ padding: '2.5rem 3rem', fontFamily: "'Archivo', sans-serif", maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 400, color: '#D6D1CE', marginBottom: '0.75rem' }}>
          Dashboard
        </h1>

        {/* OOO status banner */}
        {oooState && (
          <Link
            href="/admin/globals/availability"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: '999px',
              border: `1px solid ${oooPillColor}44`,
              background: `${oooPillColor}11`,
              fontSize: '0.72rem',
              color: oooPillColor,
              textDecoration: 'none',
              fontFamily: "'Roboto Mono', monospace",
              letterSpacing: '0.04em',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: oooPillColor, flexShrink: 0 }} />
            {oooPillLabel}
          </Link>
        )}
      </div>

      {/* Products grid */}
      <p style={sectionLabelStyle}>PRODUCTS</p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '3rem',
      }}>
        {PRODUCTS.map(p => <ProductCard key={p.id} product={p} />)}
      </div>

      {/* Quick Access */}
      <p style={sectionLabelStyle}>QUICK ACCESS</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Recent Portfolios */}
        <div style={quickCardStyle}>
          <div style={quickCardHeader}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0d9488', display: 'inline-block' }} />
            <span style={quickCardTitle}>RECENT COLLECTIONS</span>
          </div>
          {recentGalleries.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
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
                      padding: '0.75rem 0',
                      borderBottom: i < recentGalleries.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                  >
                    {/* Thumbnail */}
                    <div style={{ width: 64, height: 48, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: '#232323', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {g.coverPhoto?.url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={g.coverPhoto.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#333' }} aria-hidden="true">&#128247;</div>
                      }
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#C4BFB9', fontFamily: "'Archivo', sans-serif", textTransform: 'uppercase', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.title ?? 'Untitled'}
                      </p>
                      {g.updatedAt && (
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.68rem', color: '#555', fontFamily: "'Roboto Mono', monospace" }}>
                          {fmtLongDate(g.updatedAt)}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                        <svg width="11" height="10" viewBox="0 0 14 12" fill="none" aria-hidden="true"><path d="M5 2H9L10.5 4H13C13.6 4 14 4.4 14 5V11C14 11.6 13.6 12 13 12H1C0.4 12 0 11.6 0 11V5C0 4.4 0.4 4 1 4H3.5L5 2Z" stroke="#555" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="7" cy="8" r="2.2" stroke="#555" strokeWidth="1.3"/></svg>
                        <span style={{ fontSize: '0.67rem', color: '#555', fontFamily: "'Roboto Mono', monospace" }}>{photoCount}</span>
                      </div>
                    </div>
                    {/* Status */}
                    <span style={{ fontSize: '0.65rem', color: isPublished ? '#4ade80' : '#666', fontFamily: "'Roboto Mono', monospace", whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {isPublished ? 'Published' : 'Draft'}
                    </span>
                  </a>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: '#555', fontFamily: "'Roboto Mono', monospace" }}>No collections yet.</p>
          )}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/gallery-editor" style={quickFooterLink}>View all portfolios</a>
        </div>

        {/* Recent Orders */}
        <div style={quickCardStyle}>
          <div style={quickCardHeader}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#b45309', display: 'inline-block' }} />
            <span style={quickCardTitle}>RECENT ORDERS</span>
          </div>
          {!ordersLoaded ? (
            <p style={{ fontSize: '0.75rem', color: '#444', fontFamily: "'Roboto Mono', monospace" }}>Loading...</p>
          ) : recentOrders.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Order', 'Status', 'Customer', 'Date'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td style={{ ...tdStyle, fontFamily: "'Roboto Mono', monospace", fontSize: '0.72rem', color: '#9b9a9a' }}>
                      {o.orderNum}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.65rem', color: '#4ade80', fontFamily: "'Roboto Mono', monospace" }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#C4BFB9', fontSize: '0.78rem', fontFamily: "'Archivo', sans-serif", maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.customer}
                    </td>
                    <td style={{ ...tdStyle, color: '#555', fontFamily: "'Roboto Mono', monospace", fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                      {o.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '0.78rem', color: '#555', fontFamily: "'Roboto Mono', monospace" }}>No orders yet.</p>
          )}
        </div>

        {/* Recent Photos strip */}
        {recentPhotos.length > 0 && (
          <div style={{ ...quickCardStyle, gridColumn: '1 / -1' }}>
            <div style={quickCardHeader}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0d9488', display: 'inline-block' }} />
              <span style={quickCardTitle}>RECENT PHOTOS</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {recentPhotos.map(photo => (
                <Link
                  key={photo.id}
                  href={`/admin/collections/photos/${photo.id}`}
                  style={{ flexShrink: 0, width: '80px', height: '80px', borderRadius: '5px', overflow: 'hidden', display: 'block', border: '1px solid rgba(155,154,154,0.1)', background: '#232323' }}
                  aria-label={photo.alt ?? photo.filename ?? `Photo ${photo.id}`}
                >
                  {photo.url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={photo.url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div aria-hidden="true" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#333' }}>&#128247;</div>
                  }
                </Link>
              ))}
            </div>
            <Link href="/admin/collections/photos" style={quickFooterLink}>View photo library</Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  letterSpacing: '0.18em',
  color: '#555',
  fontFamily: "'Roboto Mono', monospace",
  marginBottom: '1rem',
  marginTop: 0,
}

const quickCardStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '8px',
  padding: '1.25rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
}

const quickCardHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.25rem',
}

const quickCardTitle: React.CSSProperties = {
  fontSize: '0.62rem',
  letterSpacing: '0.14em',
  color: '#666',
  fontFamily: "'Roboto Mono', monospace",
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: '0.62rem',
  letterSpacing: '0.08em',
  color: '#555',
  fontFamily: "'Roboto Mono', monospace",
  paddingBottom: '0.5rem',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  fontWeight: 400,
}

const tdStyle: React.CSSProperties = {
  padding: '0.55rem 0.5rem 0.55rem 0',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  verticalAlign: 'middle',
  color: '#C4BFB9',
  fontSize: '0.8rem',
}

const quickFooterLink: React.CSSProperties = {
  fontSize: '0.72rem',
  color: '#555',
  textDecoration: 'none',
  fontFamily: "'Roboto Mono', monospace",
  marginTop: '0.25rem',
  display: 'inline-block',
}
