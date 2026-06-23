'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

const CATEGORIES = ['weddings', 'portraits', 'families', 'couples', 'brands'] as const
const ui = "var(--font-heading, Archivo, sans-serif)"

export type GalleryCard = {
  id: number
  title: string
  slug: string | null
  category: string | null
  status: string
  photoCount: number
  coverThumb: string | null
}

// ---------------------------------------------------------------------------
// Switcher sections (shown in the dashboard flyout panel)
// ---------------------------------------------------------------------------

const SWITCHER = [
  { label: 'Portfolio', desc: 'Manage galleries and photos', color: '#0d9488', href: '/admin/collections/galleries', icon: '📷' },
  { label: 'Website', desc: 'Build your portfolio website', color: '#2563eb', href: '/builder', icon: '🌐' },
  { label: 'Blog', desc: 'Write and publish posts', color: '#7c3aed', href: '/admin/collections/posts', icon: '✍️' },
  { label: 'Bookings', desc: 'Services and availability', color: '#b45309', href: '/admin/globals/booking-settings', icon: '📅' },
  { label: 'Testimonials', desc: 'Client reviews', color: '#059669', href: '/admin/collections/testimonials', icon: '💬' },
  { label: 'Studio', desc: 'Settings and users', color: '#475569', href: '/admin/globals/site-config', icon: '⚙️' },
]

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CollectionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.18" />
      <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function LibraryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="4" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 7h16" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 1v3M9 1v3M13 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2l1.8 3.8 4.2.6-3 3 .7 4.2L9 11.5l-3.7 2.1.7-4.2-3-3 4.2-.6L9 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 1.5C9 1.5 6.5 5 6.5 9s2.5 7.5 2.5 7.5M9 1.5C9 1.5 11.5 5 11.5 9S9 16.5 9 16.5M1.5 9H16.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.1 3.1l1.4 1.4M13.5 13.5l1.4 1.4M14.9 3.1l-1.4 1.4M4.5 13.5l-1.4 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true" style={{ opacity: 0.55 }}>
      <path d="M2 4L5.5 7.5L9 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SortIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Dropdown filter
// ---------------------------------------------------------------------------

function FilterDropdown({ label, value, options, onChange }: {
  label: string
  value: string | null
  options: { label: string; value: string | null }[]
  onChange: (v: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const activeLabel = options.find(o => o.value === value)?.label ?? label
  const isActive = value !== null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.38rem 0.75rem',
          background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
          border: `1px solid ${isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 6, color: isActive ? '#e6e1de' : '#9b9a9a',
          fontSize: '0.78rem', fontFamily: ui, cursor: 'pointer',
          whiteSpace: 'nowrap', transition: 'border-color 0.12s, background 0.12s',
        }}
      >
        {activeLabel}
        <ChevronDownIcon />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
          background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, padding: '0.35rem', minWidth: '160px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {options.map(opt => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                width: '100%', padding: '0.45rem 0.65rem',
                background: value === opt.value ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none', borderRadius: 5,
                color: value === opt.value ? '#e6e1de' : '#9b9a9a',
                fontSize: '0.8rem', fontFamily: ui, textAlign: 'left', cursor: 'pointer',
              }}
              onMouseEnter={e => { if (value !== opt.value) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (value !== opt.value) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {opt.value !== null && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: opt.value === 'published' ? '#4ade80' : '#6b6663' }} />
              )}
              {opt.label}
              {value === opt.value && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>&#10003;</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard switcher flyout
// ---------------------------------------------------------------------------

function DashboardSwitcher({ onClose, anchorTop, anchorLeft }: { onClose: () => void; anchorTop: number; anchorLeft: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', top: anchorTop, left: anchorLeft,
        width: 280, background: '#161616',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
        boxShadow: '0 16px 48px rgba(0,0,0,0.7)', overflow: 'hidden', zIndex: 300,
      }}
    >
      <div style={{ padding: '0.5rem' }}>
        {SWITCHER.map(s => (
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a
            key={s.href}
            href={s.href}
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.75rem', borderRadius: 7, textDecoration: 'none', transition: 'background 0.1s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            {/* Colored icon circle */}
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              {s.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#d6d1ce', fontFamily: ui }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#5a5a5a', fontFamily: ui }}>{s.desc}</p>
            </div>
          </a>
        ))}
      </div>

      {/* View Dashboard footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '0.5rem' }}>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/admin"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.75rem', borderRadius: 7, textDecoration: 'none', color: '#9b9a9a', fontSize: '0.82rem', fontFamily: ui, transition: 'background 0.1s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#d6d1ce' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
        >
          <DashboardIcon />
          View Dashboard
        </a>

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sidebar nav item
// ---------------------------------------------------------------------------

function NavItem({ icon, label, href, active, collapsed, external }: {
  icon: React.ReactNode; label: string; href: string; active?: boolean; collapsed?: boolean; external?: boolean
}) {
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '0.65rem',
    padding: collapsed ? '0.6rem' : '0.55rem 0.75rem',
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: 7, fontSize: '0.85rem', fontFamily: ui, fontWeight: active ? 500 : 400,
    color: active ? '#e6e1de' : '#5a5a5a',
    background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
    textDecoration: 'none', cursor: 'pointer', transition: 'background 0.12s, color 0.12s',
    title: collapsed ? label : undefined,
  }
  const inner = (
    <>
      {icon}
      {!collapsed && <span>{label}</span>}
    </>
  )
  if (external) {
    return (
      // eslint-disable-next-line @next/next/no-html-link-for-pages
      <a href={href} style={style} title={collapsed ? label : undefined}
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#9b9a9a' } }}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#5a5a5a' } }}
      >{inner}</a>
    )
  }
  return (
    <Link href={href} style={style} title={collapsed ? label : undefined}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#9b9a9a' } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#5a5a5a' } }}
    >{inner}</Link>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GalleryIndexClient({ galleries }: { galleries: GalleryCard[] }) {
  const [collapsed, setCollapsed] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [switcherPos, setSwitcherPos] = useState({ top: 0, left: 0 })
  const switcherBtnRef = useRef<HTMLButtonElement>(null)
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<string>('portraits')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [filterCat, setFilterCat] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [orderedGalleries, setOrderedGalleries] = useState<GalleryCard[]>(galleries)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [reordering, setReordering] = useState(false)
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toggleSwitcher = () => {
    if (!showSwitcher && switcherBtnRef.current) {
      const rect = switcherBtnRef.current.getBoundingClientRect()
      setSwitcherPos({ top: rect.bottom + 6, left: rect.left })
    }
    setShowSwitcher(s => !s)
  }

  const openModal = useCallback(() => { setNewTitle(''); setCreateError(''); setShowModal(true) }, [])

  const moveGallery = (from: number, to: number) => {
    if (from === to) return
    const next = [...orderedGalleries]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setOrderedGalleries(next)
    if (reorderTimer.current) clearTimeout(reorderTimer.current)
    reorderTimer.current = setTimeout(async () => {
      setReordering(true)
      await Promise.all(next.map((g, i) =>
        fetch(`/api/galleries/${g.id}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: (i + 1) * 10 }),
        })
      ))
      setReordering(false)
    }, 800)
  }

  const createGallery = async () => {
    if (!newTitle.trim()) return
    setCreating(true); setCreateError('')
    try {
      const res = await fetch('/api/galleries', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), category: newCategory, status: 'draft' }),
      })
      if (res.ok) {
        const data = await res.json() as { doc?: { id: number } }
        const id = data.doc?.id
        if (id) window.location.href = `/gallery-editor/${id}`
      } else { setCreateError('Could not create collection. Please try again.') }
    } catch { setCreateError('Could not create collection. Check your connection.') }
    setCreating(false)
  }

  const isFiltered = !!(filterCat || filterStatus)
  const filtered = orderedGalleries.filter(g =>
    (!filterCat || g.category === filterCat) &&
    (!filterStatus || (filterStatus === 'published' ? g.status !== 'draft' : g.status === 'draft'))
  )

  const sidebarWidth = collapsed ? 56 : 220

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e0e0e', color: '#e6e1de' }}>

      {/* ---- New collection modal ---- */}
      {showModal && (
        <div
          role="dialog" aria-modal="true" aria-labelledby="new-col-title"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          onKeyDown={e => { if (e.key === 'Escape') setShowModal(false) }}
        >
          <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '2rem', width: 380, display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <h2 id="new-col-title" style={{ margin: 0, fontFamily: ui, fontSize: '1.1rem', fontWeight: 600, color: '#e6e1de' }}>New collection</h2>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#9b9a9a', fontFamily: ui }}>Collection name</span>
              <input
                type="text" value={newTitle} autoFocus
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void createGallery() }}
                placeholder="e.g. Smith Wedding"
                style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '0.6rem 0.75rem', color: '#e6e1de', fontSize: '0.9rem', outline: 'none', fontFamily: ui }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#9b9a9a', fontFamily: ui }}>Category</span>
              <select
                value={newCategory} onChange={e => setNewCategory(e.target.value)}
                style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '0.6rem 0.75rem', color: '#e6e1de', fontSize: '0.9rem', outline: 'none', fontFamily: ui, cursor: 'pointer' }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </label>
            {createError && <p role="alert" style={{ margin: 0, fontSize: '0.78rem', color: '#f0a3a3', fontFamily: ui }}>{createError}</p>}
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#9b9a9a', borderRadius: 6, padding: '0.5rem 1.1rem', fontSize: '0.85rem', cursor: 'pointer', fontFamily: ui }}>Cancel</button>
              <button
                type="button" onClick={() => void createGallery()}
                disabled={!newTitle.trim() || creating} aria-busy={creating}
                style={{ background: '#0d9488', border: 'none', color: '#fff', borderRadius: 6, padding: '0.5rem 1.3rem', fontSize: '0.85rem', fontWeight: 600, cursor: (!newTitle.trim() || creating) ? 'not-allowed' : 'pointer', fontFamily: ui, opacity: (!newTitle.trim() || creating) ? 0.5 : 1 }}
              >
                {creating ? 'Creating...' : 'Create collection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Left sidebar ---- */}
      <aside style={{
        width: sidebarWidth, flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.07)',
        background: '#0a0a0a',
        display: 'flex', flexDirection: 'column',
        padding: collapsed ? '1.25rem 0.35rem 1rem' : '1.25rem 0.75rem 1rem',
        transition: 'width 0.2s ease',
        overflow: 'hidden', position: 'relative',
      }}>

        {/* Top: dashboard switcher trigger */}
        {showSwitcher && (
          <DashboardSwitcher
            onClose={() => setShowSwitcher(false)}
            anchorTop={switcherPos.top}
            anchorLeft={switcherPos.left}
          />
        )}
        <button
          ref={switcherBtnRef}
          type="button"
          onClick={toggleSwitcher}
          aria-expanded={showSwitcher}
          title={collapsed ? 'View Dashboard' : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '0.5rem',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0.55rem' : '0.5rem 0.75rem',
            marginBottom: '0.5rem',
            background: showSwitcher ? 'rgba(255,255,255,0.07)' : 'transparent',
            border: 'none', borderRadius: 7, cursor: 'pointer', width: '100%',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = showSwitcher ? 'rgba(255,255,255,0.07)' : 'transparent' }}
        >
          <DashboardIcon />
          {!collapsed && (
            <span style={{ fontFamily: ui, fontSize: '0.72rem', fontWeight: 600, color: '#4a4a4a', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Tynnell Hollins
            </span>
          )}
        </button>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: '0.75rem' }} />

        {/* Nav items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 }}>
          <NavItem icon={<CollectionsIcon />} label="Collections" href="/gallery-editor" active collapsed={collapsed} />
          <NavItem icon={<LibraryIcon />} label="Photo Library" href="/admin/collections/photos" external collapsed={collapsed} />
          <NavItem icon={<StarIcon />} label="Featured" href="/admin/collections/galleries?where[featured][equals]=true" external collapsed={collapsed} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0.75rem 0' }} />
          <NavItem icon={<GlobeIcon />} label="View Website" href="https://tynnellhollinsphotography.com" external collapsed={collapsed} />
          <NavItem icon={<GearIcon />} label="Site Settings" href="/admin/globals/site-config" external collapsed={collapsed} />
        </nav>

        {/* Bottom: collapse toggle */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '0.55rem',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '0.55rem' : '0.5rem 0.75rem',
              background: 'transparent', border: 'none', borderRadius: 7,
              cursor: 'pointer', color: '#3a3a3a', fontSize: '0.78rem', fontFamily: ui,
              width: '100%', transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#6b6663' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#3a3a3a' }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        </div>
      </aside>

      {/* ---- Main content ---- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{ height: 58, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', flexShrink: 0, gap: '1rem' }}>
          <h1 style={{ margin: 0, fontFamily: ui, fontSize: '1.2rem', fontWeight: 600, color: '#d6d1ce', letterSpacing: '-0.01em' }}>Collections</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
            <input
              type="search" placeholder="Search..."
              aria-label="Search collections"
              style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#d6d1ce', fontSize: '0.82rem', fontFamily: ui, outline: 'none', width: 180 }}
            />
            <button
              type="button" onClick={openModal}
              style={{ background: '#0d9488', border: 'none', color: '#fff', borderRadius: 6, padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: ui, whiteSpace: 'nowrap' }}
            >
              New Collection
            </button>
          </div>
        </header>

        {/* Filter bar */}
        <div style={{ padding: '0.75rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <FilterDropdown
            label="Status" value={filterStatus} onChange={v => setFilterStatus(v)}
            options={[
              { label: 'All Status', value: null },
              { label: 'Published', value: 'published' },
              { label: 'Draft', value: 'draft' },
            ]}
          />
          <FilterDropdown
            label="Category" value={filterCat} onChange={v => setFilterCat(v)}
            options={[
              { label: 'All Categories', value: null },
              ...CATEGORIES.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
            ]}
          />
          {isFiltered && (
            <button
              type="button" onClick={() => { setFilterCat(null); setFilterStatus(null) }}
              style={{ padding: '0.32rem 0.65rem', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#6b6663', fontSize: '0.72rem', fontFamily: ui, cursor: 'pointer' }}
            >
              Clear filters
            </button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {reordering
              ? <span style={{ fontSize: '0.72rem', color: '#4b4b4b', fontFamily: ui }}>Saving order...</span>
              : <span style={{ fontSize: '0.75rem', color: '#3a3a3a', fontFamily: ui }}>
                  {filtered.length === orderedGalleries.length
                    ? `${orderedGalleries.length} ${orderedGalleries.length === 1 ? 'collection' : 'collections'}`
                    : `${filtered.length} of ${orderedGalleries.length}`}
                </span>
            }
            <button
              type="button" title="Drag cards to reorder"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#6b6663', cursor: isFiltered ? 'not-allowed' : 'default', opacity: isFiltered ? 0.3 : 0.7 }}
            >
              <SortIcon />
            </button>
          </div>
        </div>

        {/* Grid */}
        <main style={{ padding: '2rem', flex: 1 }}>
          {!isFiltered && orderedGalleries.length > 1 && (
            <p style={{ margin: '0 0 1rem', fontSize: '0.7rem', color: '#2a2a2a', fontFamily: ui }}>Drag to reorder collections</p>
          )}

          {orderedGalleries.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '6rem' }}>
              <div style={{ fontSize: '3.5rem', opacity: 0.06, marginBottom: '1.25rem' }} aria-hidden="true">&#128444;</div>
              <p style={{ fontFamily: ui, fontSize: '1rem', fontWeight: 500, color: '#4b4b4b', margin: '0 0 1.5rem' }}>No collections yet</p>
              <button type="button" onClick={openModal} style={{ background: '#0d9488', border: 'none', color: '#fff', borderRadius: 6, padding: '0.6rem 1.4rem', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: ui }}>
                Create your first collection
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#4b4b4b', fontFamily: ui, fontSize: '0.9rem' }}>
              No collections match your filters.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {filtered.map(g => {
                const realIdx = orderedGalleries.indexOf(g)
                const isDragging = dragIdx === realIdx
                const isOver = overIdx === realIdx && dragIdx !== null && dragIdx !== realIdx
                return (
                  <Link
                    key={g.id}
                    href={`/gallery-editor/${g.id}`}
                    draggable={!isFiltered}
                    onDragStart={e => { if (isFiltered) { e.preventDefault(); return }; e.dataTransfer.effectAllowed = 'move'; setDragIdx(realIdx) }}
                    onDragEnter={() => { if (!isFiltered && dragIdx !== null && dragIdx !== realIdx) setOverIdx(realIdx) }}
                    onDragOver={e => { if (!isFiltered) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' } }}
                    onDrop={e => { if (!isFiltered && dragIdx !== null) { e.preventDefault(); moveGallery(dragIdx, realIdx); setDragIdx(null); setOverIdx(null) } }}
                    onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                    style={{ textDecoration: 'none', display: 'block', borderRadius: 8, overflow: 'hidden', background: '#141414', border: `1px solid ${isOver ? 'rgba(13,148,136,0.5)' : 'rgba(255,255,255,0.06)'}`, transition: 'border-color .15s, transform .15s, opacity .12s', opacity: isDragging ? 0.35 : 1, cursor: !isFiltered ? 'grab' : 'pointer' }}
                    onMouseEnter={e => { if (!isDragging) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                  >
                    <div style={{ aspectRatio: '16/10', background: '#1a1a1a', overflow: 'hidden', position: 'relative' }}>
                      {g.coverThumb
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={g.coverThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span aria-hidden="true" style={{ fontSize: '2rem', opacity: 0.08 }}>&#128444;</span></div>
                      }
                    </div>
                    <div style={{ padding: '0.85rem 1rem 0.9rem' }}>
                      <p style={{ margin: '0 0 0.35rem', fontFamily: ui, fontSize: '0.9rem', fontWeight: 600, color: '#d6d1ce', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#5a5a5a', fontFamily: ui }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: g.status !== 'draft' ? '#4ade80' : 'transparent', border: g.status !== 'draft' ? 'none' : '1.5px solid #4a4a4a', display: 'inline-block' }} />
                        <span style={{ textTransform: 'capitalize', color: '#4a4a4a' }}>{g.category ?? 'uncategorized'}</span>
                        <span style={{ opacity: 0.35 }}>&#8226;</span>
                        <span>{g.photoCount} {g.photoCount === 1 ? 'item' : 'items'}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
