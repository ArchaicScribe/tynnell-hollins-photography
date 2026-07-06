'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { PortfolioTab } from './PortfolioTab'

// System font stack matches Pixieset's clean UI look
const ui = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const mono = "'Roboto Mono', monospace"
const teal = '#1db48e'

export interface SitePage {
  id: number | string
  title?: string | null
  slug?: string | null
  published?: boolean | null
  showInNav?: boolean | null
  isHomepage?: boolean | null
  displayOrder?: number | null
  updatedAt?: string | null
}

// ---------------------------------------------------------------------------
// Hardcoded site navigation - mirrors the actual public site structure
// ---------------------------------------------------------------------------

type NavChild = { key: string; label: string; href: string }
type NavItem  = { key: string; label: string; href: string; children?: NavChild[] }

const SITE_NAV: NavItem[] = [
  { key: 'home',         label: 'Home',         href: '/' },
  { key: 'about',        label: 'About',         href: '/about' },
  {
    key: 'portfolio', label: 'Portfolio', href: '/portfolio',
    children: [
      { key: 'portraits', label: 'Portraits', href: '/portfolio/portraits' },
      { key: 'family',    label: 'Family',    href: '/portfolio/family'    },
      { key: 'weddings',  label: 'Weddings',  href: '/portfolio/weddings'  },
    ],
  },
  { key: 'services',     label: 'Services',      href: '/services'      },
  { key: 'testimonials', label: 'Testimonials',  href: '/testimonials'  },
  { key: 'contact',      label: 'Contact',       href: '/contact'       },
  { key: 'book',         label: 'Book',          href: '/book'          },
  { key: 'blog',         label: 'Blog',          href: '/blog'          },
]

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function IconPages() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="6" y="4" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none"/>
    </svg>
  )
}

function IconBrush() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 15c1.5 0 3-1.5 3-3S4.5 9 3 9c-.8 0-1.5.7-1.5 1.5S2 12 3 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M6 12L14 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M11.5 2.5l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function IconPen() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 13l9-9 3 3-9 9H3v-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M10.5 5.5l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M14.3 3.7l-1.4 1.4M5.1 12.9l-1.4 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function IconPage() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}

function IconHome() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1.5 6.5L7 1.5l5.5 5V13H9.5V9H4.5v4H1.5V6.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  )
}

function IconPenSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 10.5l7-7 2.5 2.5-7 7H2.5v-2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M8.5 4.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function IconDots() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="3" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="11" cy="7" r="1.2" fill="currentColor"/>
    </svg>
  )
}

function IconExternal() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M2 9L9 2M9 2H5.5M9 2V5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconChevronDown({ rotated }: { rotated?: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
      style={{ transition: 'transform 0.18s', transform: rotated ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
    >
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconDashboard() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Hardcoded nav page row (Home, About, Portfolio, etc.)
// ---------------------------------------------------------------------------

function NavPageRow({
  item, selectedKey, onSelect, expanded, onToggleExpand,
}: {
  item: NavItem
  selectedKey: string
  onSelect: (key: string, href: string) => void
  expanded: boolean
  onToggleExpand: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isActive   = selectedKey === item.key
  const hasChildren = (item.children?.length ?? 0) > 0
  const isBlog = item.key === 'blog'

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => { if (hasChildren) onToggleExpand(); onSelect(item.key, item.href) }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { if (hasChildren) onToggleExpand(); onSelect(item.key, item.href) } }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!menuOpen) setHovered(false) }}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', gap: '0.55rem',
          padding: '0.45rem 0.75rem', borderRadius: 6, cursor: 'pointer',
          background: isActive ? 'rgba(255,255,255,0.08)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
          transition: 'background 0.1s',
        }}
      >
        <span style={{ color: isActive ? '#9b9a9a' : '#4a4a4a', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {item.key === 'home' ? <IconHome /> : isBlog ? <IconPenSmall /> : <IconPage />}
        </span>

        <span style={{
          flex: 1, fontSize: '0.875rem', fontFamily: ui,
          fontWeight: isActive ? 500 : 400,
          color: isActive ? '#ffffff' : '#c8c4c0',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
        }}>
          {item.label}
        </span>

        {hasChildren && (
          <span style={{ color: '#4a4a4a', display: 'flex', alignItems: 'center' }}>
            <IconChevronDown rotated={expanded} />
          </span>
        )}

        {isBlog && hovered && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
            style={{ background: 'none', border: 'none', color: '#4a4a4a', cursor: 'pointer', padding: '0.1rem 0.2rem', borderRadius: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}
            aria-label="Blog options"
          >
            <IconDots />
          </button>
        )}

        {!hasChildren && !isBlog && hovered && (
          <a
            href={item.href} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ color: '#4a4a4a', display: 'flex', alignItems: 'center', flexShrink: 0, lineHeight: 1 }}
            title={`View ${item.label} live`}
          >
            <IconExternal />
          </a>
        )}

        {isBlog && menuOpen && (
          <div
            ref={menuRef}
            style={{
              position: 'absolute', right: 4, top: '100%', zIndex: 200,
              background: '#232323', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '0.3rem', minWidth: 150,
              boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            }}
          >
            {[
              { label: 'All Posts', action: () => { window.location.href = '/blog-editor' } },
              { label: 'New Post', action: () => { window.location.href = '/blog-editor/new' } },
            ].map(menuItem => (
              <button
                key={menuItem.label} type="button"
                onClick={e => { e.stopPropagation(); menuItem.action(); setMenuOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.7rem', background: 'none', border: 'none', borderRadius: 5, fontSize: '0.8rem', fontFamily: ui, color: '#c4bfb9', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                {menuItem.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sub-pages (Portfolio children) */}
      {hasChildren && expanded && item.children?.map(child => (
        <SubPageRow
          key={child.key}
          child={child}
          isActive={selectedKey === child.key}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}

function SubPageRow({ child, isActive, onSelect }: {
  child: NavChild
  isActive: boolean
  onSelect: (key: string, href: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(child.key, child.href)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(child.key, child.href) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.55rem',
        padding: '0.4rem 0.75rem 0.4rem 2.35rem',
        borderRadius: 6, cursor: 'pointer',
        background: isActive ? 'rgba(255,255,255,0.08)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <span style={{ color: isActive ? '#9b9a9a' : '#4a4a4a', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <IconPage />
      </span>
      <span style={{
        flex: 1, fontSize: '0.85rem', fontFamily: ui,
        fontWeight: isActive ? 500 : 400,
        color: isActive ? '#ffffff' : '#c0bcb8',
      }}>
        {child.label}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Custom Puck page row (NOT IN MENU section)
// ---------------------------------------------------------------------------

function PuckPageRow({ page, onDelete, onToggleNav, onRefresh }: {
  page: SitePage
  onDelete: (id: string | number) => void
  onToggleNav: (id: string | number, current: boolean) => void
  onRefresh: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
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
    <div
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: '0.55rem',
        padding: '0.45rem 0.75rem', borderRadius: 6, cursor: 'pointer',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!menuOpen) setHovered(false) }}
      onClick={() => { if (!menuOpen) window.location.href = `/builder/${page.slug ?? ''}` }}
    >
      <span style={{ color: '#4a4a4a', flexShrink: 0, display: 'flex', alignItems: 'center' }}><IconPage /></span>
      <span style={{ flex: 1, fontSize: '0.875rem', fontFamily: ui, color: '#c0bcb8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
        {page.title ?? 'Untitled'}
      </span>
      {hovered && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
          style={{ background: 'none', border: 'none', color: '#4a4a4a', cursor: 'pointer', padding: '0.1rem 0.2rem', borderRadius: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}
          aria-label={`Options for ${page.title ?? 'page'}`}
        >
          <IconDots />
        </button>
      )}
      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute', right: 4, top: '100%', zIndex: 200,
            background: '#232323', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '0.3rem', minWidth: 170,
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          }}
        >
          {[
            { label: 'Edit in builder', action: () => { window.location.href = `/builder/${page.slug ?? ''}` } },
            { label: page.showInNav ? 'Remove from menu' : 'Add to menu', action: () => { void onToggleNav(page.id, Boolean(page.showInNav)); onRefresh(); setMenuOpen(false); setHovered(false) } },
            { label: 'Delete', danger: true, action: () => { onDelete(page.id); setMenuOpen(false); setHovered(false) } },
          ].map(item => (
            <button
              key={item.label} type="button"
              onClick={() => { item.action(); setMenuOpen(false) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.7rem', background: 'none', border: 'none', borderRadius: 5, fontSize: '0.8rem', fontFamily: ui, color: item.danger ? '#f87171' : '#c4bfb9', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// New page modal
// ---------------------------------------------------------------------------

function NewPageModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [template, setTemplate] = useState('blank')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const toSlug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  const create = async () => {
    if (!title.trim()) return
    setCreating(true); setError('')
    const slug = toSlug(title) || `page-${Date.now()}`
    try {
      const res = await fetch('/api/pages', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), slug, published: false, displayOrder: Date.now(), template }),
      })
      if (res.ok) {
        window.location.href = `/builder/${slug}`
      } else {
        setError('Could not create page. Please try again.')
        setCreating(false)
      }
    } catch { setError('Connection error.'); setCreating(false) }
  }

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="new-page-label"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={e => { if (e.key === 'Escape') onClose() }}
    >
      <div style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '1.75rem', width: 380, display: 'flex', flexDirection: 'column', gap: '1.1rem', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
        <h2 id="new-page-label" style={{ margin: 0, fontFamily: ui, fontSize: '1rem', fontWeight: 600, color: '#e6e1de' }}>New custom page</h2>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontFamily: mono, fontSize: '0.68rem', color: '#7a7a7a', letterSpacing: '0.06em' }}>Page title</span>
          <input
            autoFocus type="text" value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void create() }}
            placeholder="e.g. FAQ"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '0.6rem 0.75rem', color: '#e6e1de', fontSize: '0.88rem', outline: 'none', fontFamily: ui }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontFamily: mono, fontSize: '0.68rem', color: '#7a7a7a', letterSpacing: '0.06em' }}>Template</span>
          <select
            value={template} onChange={e => setTemplate(e.target.value)}
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '0.6rem 0.75rem', color: '#e6e1de', fontSize: '0.85rem', outline: 'none', fontFamily: ui }}
          >
            <option value="blank">Blank</option>
            <option value="landing">Landing Page</option>
            <option value="about">About</option>
            <option value="gallery">Gallery Showcase</option>
          </select>
        </label>
        {error && <p role="alert" style={{ margin: 0, fontFamily: mono, fontSize: '0.75rem', color: '#f87171' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#9b9a9a', borderRadius: 7, padding: '0.5rem 1rem', fontSize: '0.82rem', fontFamily: ui, cursor: 'pointer' }}>Cancel</button>
          <button
            type="button" onClick={() => void create()} disabled={!title.trim() || creating} aria-busy={creating}
            style={{ background: teal, border: 'none', color: '#fff', borderRadius: 7, padding: '0.5rem 1.2rem', fontSize: '0.82rem', fontWeight: 600, fontFamily: ui, cursor: !title.trim() || creating ? 'not-allowed' : 'pointer', opacity: !title.trim() || creating ? 0.5 : 1 }}
          >
            {creating ? 'Creating...' : 'Create page'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Product switcher dropdown
// ---------------------------------------------------------------------------

const SWITCHER_ITEMS = [
  { label: 'Portfolio',     desc: 'Galleries and photos',    href: '/builder?product=portfolio',         color: '#0d9488' },
  { label: 'Website',       desc: 'Pages and content',       href: '/builder',                           color: '#2563eb', active: true },
  { label: 'Blog',          desc: 'Posts and articles',      href: '/blog-editor',                       color: '#7c3aed' },
  { label: 'Bookings',      desc: 'Services and availability', href: '/availability',                   color: '#b45309' },
  { label: 'Testimonials',  desc: 'Client reviews',          href: '/admin/collections/testimonials',    color: '#059669' },
  { label: 'Studio',        desc: 'Site settings',           href: '/admin',                             color: '#475569' },
]

function ProductSwitcher({ onClose, anchorRef }: { onClose: () => void; anchorRef: React.RefObject<HTMLButtonElement | null> }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 52, left: 12 })

  useEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left })
    }
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, anchorRef])

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 500, background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.5rem', width: 240, boxShadow: '0 12px 40px rgba(0,0,0,0.7)' }}
    >
      {SWITCHER_ITEMS.map(item => (
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a
          key={item.label} href={item.href} onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: 7, textDecoration: 'none', background: item.active ? 'rgba(255,255,255,0.06)' : 'none', transition: 'background 0.1s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = item.active ? 'rgba(255,255,255,0.06)' : 'none' }}
        >
          <span style={{ width: 28, height: 28, borderRadius: 7, background: item.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 12, height: 12, background: 'rgba(255,255,255,0.8)', borderRadius: 2, display: 'block' }} />
          </span>
          <span>
            <span style={{ display: 'block', fontFamily: ui, fontSize: '0.82rem', fontWeight: item.active ? 600 : 400, color: item.active ? '#e6e1de' : '#c4bfb9' }}>{item.label}</span>
            <span style={{ display: 'block', fontFamily: mono, fontSize: '0.68rem', color: '#5a5a5a', marginTop: 1 }}>{item.desc}</span>
          </span>
        </a>
      ))}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0.35rem 0' }} />
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/studio" onClick={onClose}
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.75rem', borderRadius: 7, textDecoration: 'none', color: '#9b9a9a', fontSize: '0.8rem', fontFamily: ui, transition: 'background 0.1s, color 0.1s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#e6e1de' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
      >
        <IconDashboard />
        Dashboard
      </a>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type Tab = 'pages' | 'design' | 'blog' | 'settings'
type Product = 'portfolio' | 'website'

export function SiteEditorClient({ initialPages, initialProduct = 'website' }: { initialPages: SitePage[]; initialProduct?: Product }) {
  const [pages, setPages] = useState<SitePage[]>(initialPages)
  const [activeTab, setActiveTab] = useState<Tab>('pages')
  const [product, setProduct] = useState<Product>(initialProduct)
  const [showModal, setShowModal] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const switcherBtnRef = useRef<HTMLButtonElement>(null)

  const switchProduct = (p: Product) => {
    setProduct(p)
    const url = new URL(window.location.href)
    if (p === 'website') url.searchParams.delete('product')
    else url.searchParams.set('product', p)
    window.history.replaceState(null, '', url.toString())
  }

  // Which page is selected and shown in the preview pane
  const [selectedKey, setSelectedKey] = useState('home')
  const [previewHref, setPreviewHref] = useState('/')

  // Portfolio sub-pages expand/collapse
  const [portfolioExpanded, setPortfolioExpanded] = useState(false)

  const reload = useCallback(() => {
    fetch('/api/pages?sort=displayOrder&limit=100&depth=0', { credentials: 'include' })
      .then(r => r.json())
      .then((d: { docs?: SitePage[] }) => setPages(d.docs ?? []))
      .catch(() => {})
  }, [])

  const handleSelect = (key: string, href: string) => {
    setSelectedKey(key)
    setPreviewHref(href)
    if (key === 'portfolio') setPortfolioExpanded(true)
  }

  const deletePage = async (id: string | number) => {
    if (!confirm('Delete this page? This cannot be undone.')) return
    await fetch(`/api/pages/${id}`, { method: 'DELETE', credentials: 'include' })
    reload()
  }

  const toggleNav = async (id: string | number, current: boolean) => {
    await fetch(`/api/pages/${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showInNav: !current }),
    })
    reload()
  }

  const publishAll = async () => {
    setPublishing(true)
    await Promise.all(
      pages.filter(p => !p.published).map(p =>
        fetch(`/api/pages/${p.id}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published: true }),
        })
      )
    )
    reload()
    setPublishing(false)
  }

  // Custom Puck builder pages always go in NOT IN MENU
  const customPages = pages.filter(p => !p.showInNav)

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'pages',    icon: <IconPages />,   label: 'Pages'    },
    { id: 'design',   icon: <IconBrush />,   label: 'Design'   },
    { id: 'blog',     icon: <IconPen />,     label: 'Blog'     },
    { id: 'settings', icon: <IconSettings />, label: 'Settings' },
  ]

  const previewLabel = previewHref === '/' ? 'tynnellhollinsphotography.com' : `tynnellhollinsphotography.com${previewHref}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#141414', color: '#d4d0cc', fontFamily: ui }}>

      {showModal && <NewPageModal onClose={() => setShowModal(false)} />}
      {showSwitcher && <ProductSwitcher onClose={() => setShowSwitcher(false)} anchorRef={switcherBtnRef} />}

      {/* ---- Top bar ---- */}
      <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#141414' }}>

        {/* Left: brand monogram + studio dropdown + product tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/admin" style={{ width: 30, height: 30, borderRadius: '50%', background: teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff', fontFamily: ui, flexShrink: 0, textDecoration: 'none' }}>
            TH
          </a>

          {/* Studio product switcher - Pixieset-style left dropdown */}
          <button
            ref={switcherBtnRef}
            type="button"
            onClick={() => setShowSwitcher(s => !s)}
            aria-expanded={showSwitcher}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              background: showSwitcher ? 'rgba(255,255,255,0.06)' : 'none',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              color: showSwitcher ? '#e6e1de' : '#9b9a9a',
              fontFamily: ui, fontSize: '0.85rem', fontWeight: 500,
              padding: '0.35rem 0.6rem',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#e6e1de' }}
            onMouseLeave={e => { if (!showSwitcher) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9b9a9a' } }}
          >
            {product === 'portfolio' ? 'Portfolio' : 'Website'}
            <IconChevronDown rotated={showSwitcher} />
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 0.35rem', flexShrink: 0 }} />

          {(['portfolio', 'website'] as Product[]).map(p => (
            <button
              key={p} type="button"
              onClick={() => switchProduct(p)}
              aria-pressed={product === p}
              style={{
                background: product === p ? 'rgba(255,255,255,0.08)' : 'none',
                border: 'none', borderRadius: 6,
                color: product === p ? '#e6e1de' : '#6b6663',
                fontSize: '0.85rem', fontFamily: ui, fontWeight: product === p ? 600 : 400,
                padding: '0.35rem 0.75rem', cursor: 'pointer',
                transition: 'background 0.1s, color 0.1s',
              }}
              onMouseEnter={e => { if (product !== p) { (e.currentTarget as HTMLElement).style.color = '#c4bfb9'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' } }}
              onMouseLeave={e => { if (product !== p) { (e.currentTarget as HTMLElement).style.color = '#6b6663'; (e.currentTarget as HTMLElement).style.background = 'none' } }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Right: dashboard link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/admin"
            title="Back to dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#9b9a9a', fontSize: '0.75rem', fontFamily: ui, textDecoration: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
          >
            <IconDashboard /> Dashboard
          </a>
        </div>
      </div>

      {/* ---- Body ---- */}
      {product === 'portfolio' ? (
        <PortfolioTab />
      ) : (
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ---- Sidebar ---- */}
        <div style={{ width: 300, flexShrink: 0, background: '#141414', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Tab icon row */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {tabs.map(t => (
              <button
                key={t.id} type="button"
                onClick={() => setActiveTab(t.id)}
                aria-pressed={activeTab === t.id}
                title={t.label}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.85rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === t.id ? teal : '#4a4a4a', borderBottom: `2px solid ${activeTab === t.id ? teal : 'transparent'}`, transition: 'color 0.12s, border-color 0.12s' }}
                onMouseEnter={e => { if (activeTab !== t.id) (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
                onMouseLeave={e => { if (activeTab !== t.id) (e.currentTarget as HTMLElement).style.color = '#4a4a4a' }}
              >
                {t.icon}
              </button>
            ))}
          </div>

          {/* Pages tab */}
          {activeTab === 'pages' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1rem 0.5rem' }}>
                <span style={{ fontFamily: ui, fontSize: '0.9rem', fontWeight: 600, color: '#e0dcd8' }}>Pages</span>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: teal, fontSize: '0.82rem', fontFamily: ui, fontWeight: 500, padding: '0.25rem 0.4rem', borderRadius: 5 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(29,180,142,0.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                >
                  <IconPlus /> Add Page
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0.5rem' }}>

                {/* SITE MENU - hardcoded real pages */}
                <p style={{ margin: '0.5rem 0 0.3rem 0.75rem', fontFamily: mono, fontSize: '0.58rem', letterSpacing: '0.12em', color: '#4a4a4a', textTransform: 'uppercase' }}>Site Menu</p>
                {SITE_NAV.map(item => (
                  <NavPageRow
                    key={item.key}
                    item={item}
                    selectedKey={selectedKey}
                    onSelect={handleSelect}
                    expanded={item.key === 'portfolio' ? portfolioExpanded : false}
                    onToggleExpand={() => { if (item.key === 'portfolio') setPortfolioExpanded(x => !x) }}
                  />
                ))}

                {/* NOT IN MENU - custom Puck builder pages */}
                {customPages.length > 0 && (
                  <>
                    <p style={{ margin: '1.25rem 0 0.3rem 0.75rem', fontFamily: mono, fontSize: '0.58rem', letterSpacing: '0.12em', color: '#4a4a4a', textTransform: 'uppercase' }}>Not in Menu</p>
                    {customPages.map(p => (
                      <PuckPageRow key={String(p.id)} page={p} onDelete={deletePage} onToggleNav={toggleNav} onRefresh={reload} />
                    ))}
                  </>
                )}
              </div>
            </>
          )}

          {/* Design tab */}
          {activeTab === 'design' && (
            <div style={{ flex: 1, padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ margin: 0, fontFamily: ui, fontSize: '0.82rem', color: '#6b6b6b', lineHeight: 1.6 }}>
                Global design tokens are managed in code at <code style={{ color: '#9b9a9a', fontSize: '0.78rem' }}>tokens.css</code>.
              </p>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/admin/globals/site-config" style={{ color: teal, fontSize: '0.8rem', fontFamily: ui, textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
              >
                Open Site Config
              </a>
            </div>
          )}

          {/* Blog tab */}
          {activeTab === 'blog' && (
            <div style={{ flex: 1, padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ margin: '0 0 0.75rem', fontFamily: ui, fontSize: '0.9rem', fontWeight: 600, color: '#e0dcd8' }}>Blog</p>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              {[
                { label: 'All Posts',  href: '/blog-editor'     },
                { label: 'New Post',   href: '/blog-editor/new' },
              ].map(item => (
                <a key={item.href} href={item.href}
                  style={{ display: 'block', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, color: '#c4bfb9', textDecoration: 'none', fontFamily: ui, fontSize: '0.83rem' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}

          {/* Settings tab */}
          {activeTab === 'settings' && (
            <div style={{ flex: 1, padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ margin: '0 0 0.75rem', fontFamily: ui, fontSize: '0.9rem', fontWeight: 600, color: '#e0dcd8' }}>Settings</p>
              {/* eslint-disable @next/next/no-html-link-for-pages */}
              {[
                { label: 'Site Config', href: '/admin/globals/site-config' },
                { label: 'Hero Slides', href: '/admin/globals/hero-slides'  },
                { label: 'About Page',  href: '/admin/globals/about-page'   },
              ].map(item => (
                <a key={item.href} href={item.href}
                  style={{ display: 'block', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, color: '#c4bfb9', textDecoration: 'none', fontFamily: ui, fontSize: '0.83rem' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                >
                  {item.label}
                </a>
              ))}
              {/* eslint-enable @next/next/no-html-link-for-pages */}
            </div>
          )}

          {/* ---- Bottom: Preview + Publish ---- */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <a
              href="https://tynnellhollinsphotography.com" target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.6rem', background: 'none', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, color: '#9b9a9a', fontSize: '0.82rem', fontFamily: ui, textDecoration: 'none', fontWeight: 500, transition: 'border-color 0.12s, color 0.12s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.28)'; el.style.color = '#d4d0cc' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.14)'; el.style.color = '#9b9a9a' }}
            >
              Preview
            </a>
            <button
              type="button"
              onClick={() => void publishAll()}
              disabled={publishing} aria-busy={publishing}
              style={{ flex: 1, padding: '0.6rem', background: teal, border: 'none', borderRadius: 7, color: '#fff', fontSize: '0.82rem', fontFamily: ui, fontWeight: 600, cursor: publishing ? 'wait' : 'pointer', opacity: publishing ? 0.7 : 1, transition: 'opacity 0.12s' }}
              onMouseEnter={e => { if (!publishing) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none' }}
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {/* ---- Right: live page preview ---- */}
        <div style={{ flex: 1, background: '#0e0e0e', position: 'relative', overflow: 'hidden' }}>
          {/* Address bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 10 }}>
            <span style={{ fontFamily: mono, fontSize: '0.72rem', color: '#4a4a4a', letterSpacing: '0.02em' }}>
              {previewLabel}
            </span>
            <a
              href={previewHref} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#4a4a4a', fontSize: '0.72rem', fontFamily: ui, textDecoration: 'none', padding: '0.2rem 0.5rem', borderRadius: 4, background: 'rgba(255,255,255,0.04)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4a4a4a' }}
            >
              <IconExternal /> Open
            </a>
          </div>

          {/* Live preview iframe - key changes force a reload when page changes */}
          <iframe
            key={previewHref}
            src={previewHref}
            style={{ position: 'absolute', top: 36, left: 0, right: 0, bottom: 0, width: '100%', height: 'calc(100% - 36px)', border: 'none' }}
            title={`Preview: ${previewLabel}`}
          />
        </div>
      </div>
      )}
    </div>
  )
}
