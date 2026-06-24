'use client'
import { useState, useCallback, useRef, useEffect } from 'react'

const ui = "'Archivo', system-ui, sans-serif"
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

function IconBlog() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 10l7-7 2 2-7 7H2v-2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
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

function IconChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
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
// Page context menu
// ---------------------------------------------------------------------------

function PageMenu({ page, onDelete, onToggleNav, onClose }: {
  page: SitePage
  onDelete: () => void
  onToggleNav: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const items = [
    { label: 'Edit page', action: () => { window.location.href = `/builder/${page.slug ?? ''}` } },
    { label: page.showInNav ? 'Remove from menu' : 'Add to menu', action: onToggleNav },
    { label: 'Delete', action: onDelete, danger: true },
  ]

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', right: 4, top: '100%', zIndex: 200,
        background: '#232323', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '0.3rem', minWidth: 170,
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      }}
    >
      {items.map(item => (
        <button
          key={item.label}
          type="button"
          onClick={() => { item.action(); onClose() }}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.7rem', background: 'none', border: 'none', borderRadius: 5, fontSize: '0.8rem', fontFamily: ui, color: item.danger ? '#f87171' : '#c4bfb9', cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single page row
// ---------------------------------------------------------------------------

function PageRow({ page, onDelete, onToggleNav, onRefresh }: {
  page: SitePage
  onDelete: (id: string | number) => void
  onToggleNav: (id: string | number, current: boolean) => void
  onRefresh: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const isHome = Boolean(page.isHomepage)

  const pageIcon = isHome ? <IconHome /> : (page.slug === 'blog' ? <IconBlog /> : <IconPage />)

  return (
    <div
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: '0.55rem',
        padding: '0.5rem 0.75rem', borderRadius: 6, cursor: 'pointer',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!menuOpen) setHovered(false) }}
      onClick={() => { if (!menuOpen) window.location.href = `/builder/${page.slug ?? ''}` }}
    >
      <span style={{ color: '#6b6b6b', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {pageIcon}
      </span>

      <span style={{ flex: 1, fontSize: '0.85rem', fontFamily: ui, fontWeight: 400, color: '#d4d0cc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
        {page.title ?? 'Untitled'}
      </span>

      {hovered && !menuOpen && page.published && page.slug && (
        <a
          href={`/${page.slug}`} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ color: '#6b6b6b', display: 'flex', alignItems: 'center', flexShrink: 0, lineHeight: 1 }}
          title="View live"
        >
          <IconExternal />
        </a>
      )}

      {hovered && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
          style={{ background: 'none', border: 'none', color: '#6b6b6b', cursor: 'pointer', padding: '0.1rem 0.2rem', borderRadius: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}
          aria-label={`Options for ${page.title ?? 'page'}`}
        >
          <IconDots />
        </button>
      )}

      {menuOpen && (
        <PageMenu
          page={page}
          onDelete={() => { onDelete(page.id); setMenuOpen(false); setHovered(false) }}
          onToggleNav={() => { onToggleNav(page.id, Boolean(page.showInNav)); onRefresh(); setMenuOpen(false) }}
          onClose={() => { setMenuOpen(false); setHovered(false) }}
        />
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
        <h2 id="new-page-label" style={{ margin: 0, fontFamily: ui, fontSize: '1rem', fontWeight: 600, color: '#e6e1de' }}>New page</h2>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontFamily: mono, fontSize: '0.68rem', color: '#7a7a7a', letterSpacing: '0.06em' }}>Page title</span>
          <input
            autoFocus type="text" value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void create() }}
            placeholder="e.g. About Me"
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
          <button type="button" onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#9b9a9a', borderRadius: 7, padding: '0.5rem 1rem', fontSize: '0.82rem', fontFamily: ui, cursor: 'pointer' }}>
            Cancel
          </button>
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
// Main
// ---------------------------------------------------------------------------

type Tab = 'pages' | 'design' | 'blog' | 'settings'

const SWITCHER_ITEMS = [
  { label: 'Portfolio', desc: 'Galleries and photos', href: '/gallery-editor', color: '#0d9488' },
  { label: 'Website', desc: 'Pages and content', href: '/builder', color: '#2563eb', active: true },
  { label: 'Blog', desc: 'Posts and articles', href: '/admin/collections/posts', color: '#7c3aed' },
  { label: 'Bookings', desc: 'Services and availability', href: '/admin/globals/booking-settings', color: '#b45309' },
  { label: 'Testimonials', desc: 'Client reviews', href: '/admin/collections/testimonials', color: '#059669' },
  { label: 'Studio', desc: 'Site settings', href: '/admin', color: '#475569' },
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
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, anchorRef])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', top: pos.top, left: pos.left, zIndex: 500,
        background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '0.5rem', width: 240,
        boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
      }}
    >
      {SWITCHER_ITEMS.map(item => (
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a
          key={item.label}
          href={item.href}
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.6rem 0.75rem', borderRadius: 7, textDecoration: 'none',
            background: item.active ? 'rgba(255,255,255,0.06)' : 'none',
            transition: 'background 0.1s',
          }}
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
    </div>
  )
}

export function SiteEditorClient({ initialPages }: { initialPages: SitePage[] }) {
  const [pages, setPages] = useState<SitePage[]>(initialPages)
  const [activeTab, setActiveTab] = useState<Tab>('pages')
  const [showModal, setShowModal] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const switcherBtnRef = useRef<HTMLButtonElement>(null)

  const reload = useCallback(() => {
    fetch('/api/pages?sort=displayOrder&limit=100&depth=0', { credentials: 'include' })
      .then(r => r.json())
      .then((d: { docs?: SitePage[] }) => setPages(d.docs ?? []))
      .catch(() => {})
  }, [])

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

  const inMenu = pages.filter(p => p.showInNav)
  const notInMenu = pages.filter(p => !p.showInNav)

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'pages', icon: <IconPages />, label: 'Pages' },
    { id: 'design', icon: <IconBrush />, label: 'Design' },
    { id: 'blog', icon: <IconPen />, label: 'Blog' },
    { id: 'settings', icon: <IconSettings />, label: 'Settings' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#141414', color: '#d4d0cc', fontFamily: ui }}>

      {showModal && <NewPageModal onClose={() => setShowModal(false)} />}
      {showSwitcher && <ProductSwitcher onClose={() => setShowSwitcher(false)} anchorRef={switcherBtnRef} />}

      {/* ---- Top bar ---- */}
      <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#141414' }}>
        {/* Left: product switcher */}
        <button
          ref={switcherBtnRef}
          type="button"
          onClick={() => setShowSwitcher(s => !s)}
          aria-expanded={showSwitcher}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: showSwitcher ? 'rgba(255,255,255,0.06)' : 'none', border: 'none', cursor: 'pointer', color: '#d4d0cc', fontFamily: ui, fontSize: '0.9rem', fontWeight: 500, padding: '0.3rem 0.5rem', borderRadius: 6 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { if (!showSwitcher) (e.currentTarget as HTMLElement).style.background = 'none' }}
        >
          Website <IconChevronDown />
        </button>

        {/* Right: nav icons + avatar */}
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
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', fontFamily: ui, flexShrink: 0 }}>
            T
          </div>
        </div>
      </div>

      {/* ---- Body (sidebar + preview) ---- */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ---- Sidebar ---- */}
        <div style={{ width: 300, flexShrink: 0, background: '#141414', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Tab icon row */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                aria-pressed={activeTab === t.id}
                title={t.label}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0.85rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer',
                  color: activeTab === t.id ? teal : '#4a4a4a',
                  borderBottom: `2px solid ${activeTab === t.id ? teal : 'transparent'}`,
                  transition: 'color 0.12s, border-color 0.12s',
                }}
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
              {/* Pages heading + Add Page */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1rem 0.5rem' }}>
                <span style={{ fontFamily: ui, fontSize: '0.88rem', fontWeight: 600, color: '#d4d0cc' }}>Pages</span>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: teal, fontSize: '0.8rem', fontFamily: ui, fontWeight: 500, padding: '0.25rem 0.4rem', borderRadius: 5 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(29,180,142,0.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                >
                  <IconPlus /> Add Page
                </button>
              </div>

              {/* Page list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0.5rem' }}>
                {/* SITE MENU */}
                <p style={{ margin: '0.5rem 0 0.3rem 0.75rem', fontFamily: mono, fontSize: '0.58rem', letterSpacing: '0.12em', color: '#4a4a4a', textTransform: 'uppercase' }}>Site Menu</p>
                {inMenu.length > 0
                  ? inMenu.map(p => (
                      <PageRow key={String(p.id)} page={p} onDelete={deletePage} onToggleNav={toggleNav} onRefresh={reload} />
                    ))
                  : <p style={{ margin: '0 0 0.5rem 0.75rem', fontFamily: mono, fontSize: '0.72rem', color: '#3a3a3a' }}>No pages in menu</p>
                }

                {/* NOT IN MENU */}
                {notInMenu.length > 0 && (
                  <>
                    <p style={{ margin: '1rem 0 0.3rem 0.75rem', fontFamily: mono, fontSize: '0.58rem', letterSpacing: '0.12em', color: '#4a4a4a', textTransform: 'uppercase' }}>Not in Menu</p>
                    {notInMenu.map(p => (
                      <PageRow key={String(p.id)} page={p} onDelete={deletePage} onToggleNav={toggleNav} onRefresh={reload} />
                    ))}
                  </>
                )}

                {pages.length === 0 && (
                  <p style={{ fontFamily: mono, fontSize: '0.75rem', color: '#3a3a3a', padding: '0.5rem 0.75rem' }}>
                    No pages yet. Click &quot;Add Page&quot; to create one.
                  </p>
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
              <p style={{ margin: '0 0 0.75rem', fontFamily: ui, fontSize: '0.88rem', fontWeight: 600, color: '#d4d0cc' }}>Blog</p>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/admin/collections/posts" style={{ display: 'block', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, color: '#c4bfb9', textDecoration: 'none', fontFamily: ui, fontSize: '0.83rem' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
              >
                All Posts
              </a>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/admin/collections/posts/create" style={{ display: 'block', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, color: '#c4bfb9', textDecoration: 'none', fontFamily: ui, fontSize: '0.83rem' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
              >
                New Post
              </a>
            </div>
          )}

          {/* Settings tab */}
          {activeTab === 'settings' && (
            <div style={{ flex: 1, padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ margin: '0 0 0.75rem', fontFamily: ui, fontSize: '0.88rem', fontWeight: 600, color: '#d4d0cc' }}>Settings</p>
              {/* eslint-disable @next/next/no-html-link-for-pages */}
              {[
                { label: 'Site Config', href: '/admin/globals/site-config' },
                { label: 'Hero Slides', href: '/admin/globals/hero-slides' },
                { label: 'About Page', href: '/admin/globals/about-page' },
              ].map(item => (
                <a
                  key={item.href}
                  href={item.href}
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
              disabled={publishing}
              aria-busy={publishing}
              style={{ flex: 1, padding: '0.6rem', background: teal, border: 'none', borderRadius: 7, color: '#fff', fontSize: '0.82rem', fontFamily: ui, fontWeight: 600, cursor: publishing ? 'wait' : 'pointer', opacity: publishing ? 0.7 : 1, transition: 'opacity 0.12s, filter 0.12s' }}
              onMouseEnter={e => { if (!publishing) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none' }}
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {/* ---- Right: website preview ---- */}
        <div style={{ flex: 1, background: '#0e0e0e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <iframe
            src="/"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Website preview"
          />
        </div>
      </div>
    </div>
  )
}
