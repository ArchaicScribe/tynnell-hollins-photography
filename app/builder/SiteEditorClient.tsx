'use client'
import { useState, useCallback, useRef, useEffect } from 'react'

const ui = "var(--font-heading, Archivo, sans-serif)"
const mono = "var(--font-body, 'Roboto Mono', monospace)"

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

function PageIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="2" y="1" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 5h5M5 8h5M5 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M1.5 7L7.5 1.5L13.5 7V13.5H10V9.5H5V13.5H1.5V7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="3" cy="7" r="1.2" fill="currentColor" />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" />
      <circle cx="11" cy="7" r="1.2" fill="currentColor" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M2 9L9 2M9 2H5.5M9 2V5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="7" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8.5 1.5C8.5 1.5 6 5 6 8.5s2.5 7 2.5 7M8.5 1.5C8.5 1.5 11 5 11 8.5s-2.5 7-2.5 7M1.5 8.5h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function StylesIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
      <circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="12" r="3" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8.5 1v2M8.5 14v2M1 8.5h2M14 8.5h2M3.2 3.2l1.4 1.4M12.4 12.4l1.4 1.4M14.8 3.2l-1.4 1.4M5.6 12.4l-1.4 1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
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

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', right: 0, top: '100%', zIndex: 100,
        background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 7, padding: '0.3rem', minWidth: 160,
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
      }}
    >
      {[
        { label: 'Edit in Builder', action: () => { window.location.href = `/builder/${page.slug ?? ''}` } },
        { label: page.showInNav ? 'Remove from menu' : 'Add to menu', action: onToggleNav },
        { label: 'Delete', action: onDelete, danger: true },
      ].map(item => (
        <button
          key={item.label}
          type="button"
          onClick={() => { item.action(); onClose() }}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.45rem 0.65rem', background: 'none', border: 'none', borderRadius: 5, fontSize: '0.8rem', fontFamily: ui, color: item.danger ? '#f87171' : '#c4bfb9', cursor: 'pointer' }}
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

  const isLive = Boolean(page.published)
  const isHome = Boolean(page.isHomepage)

  return (
    <div
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.55rem 0.75rem', borderRadius: 7, cursor: 'pointer', background: hovered ? 'rgba(255,255,255,0.05)' : 'transparent', transition: 'background 0.1s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false) }}
      onClick={() => { if (!menuOpen) window.location.href = `/builder/${page.slug ?? ''}` }}
    >
      {/* Status dot */}
      <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: isLive ? '#4ade80' : 'transparent', border: isLive ? 'none' : '1.5px solid #4a4a4a', display: 'inline-block' }} />

      {/* Icon */}
      <span style={{ color: '#4a4a4a', flexShrink: 0 }}>
        {isHome ? <HomeIcon /> : <PageIcon />}
      </span>

      {/* Title */}
      <span style={{ flex: 1, fontSize: '0.85rem', fontFamily: ui, color: '#c4bfb9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
        {page.title ?? 'Untitled'}
      </span>

      {/* External link for live pages */}
      {isLive && page.slug && hovered && !menuOpen && (
        <a
          href={`/${page.slug}`} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ color: '#5a5a5a', flexShrink: 0, display: 'flex', alignItems: 'center', lineHeight: 1 }}
          title="View live page"
        >
          <ExternalIcon />
        </a>
      )}

      {/* Dots menu button */}
      {hovered && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
          style={{ background: 'none', border: 'none', color: '#5a5a5a', cursor: 'pointer', padding: '0.1rem', borderRadius: 4, display: 'flex', alignItems: 'center', flexShrink: 0, lineHeight: 1 }}
        >
          <DotsIcon />
        </button>
      )}

      {/* Context menu */}
      {menuOpen && (
        <PageMenu
          page={page}
          onDelete={() => onDelete(page.id)}
          onToggleNav={() => { onToggleNav(page.id, Boolean(page.showInNav)); onRefresh() }}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// New page modal
// ---------------------------------------------------------------------------

function NewPageModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
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
        body: JSON.stringify({ title: title.trim(), slug, published: false, displayOrder: Date.now() }),
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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={e => { if (e.key === 'Escape') onClose() }}
    >
      <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '1.75rem', width: 360, display: 'flex', flexDirection: 'column', gap: '1.1rem', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
        <h2 id="new-page-label" style={{ margin: 0, fontFamily: ui, fontSize: '1rem', fontWeight: 600, color: '#e6e1de' }}>New page</h2>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontFamily: mono, fontSize: '0.7rem', color: '#9b9a9a' }}>Page title</span>
          <input
            autoFocus type="text" value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void create() }}
            placeholder="e.g. About Me"
            style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '0.6rem 0.75rem', color: '#e6e1de', fontSize: '0.88rem', outline: 'none', fontFamily: ui }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontFamily: mono, fontSize: '0.7rem', color: '#9b9a9a' }}>Template</span>
          <select
            value={template} onChange={e => setTemplate(e.target.value)}
            style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '0.6rem 0.75rem', color: '#e6e1de', fontSize: '0.85rem', outline: 'none', fontFamily: ui }}
          >
            <option value="blank">Blank</option>
            <option value="landing">Landing Page</option>
            <option value="about">About</option>
            <option value="gallery">Gallery Showcase</option>
          </select>
        </label>
        {error && <p role="alert" style={{ margin: 0, fontFamily: mono, fontSize: '0.75rem', color: '#f87171' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#9b9a9a', borderRadius: 6, padding: '0.45rem 1rem', fontSize: '0.82rem', fontFamily: ui, cursor: 'pointer' }}>Cancel</button>
          <button
            type="button" onClick={() => void create()} disabled={!title.trim() || creating} aria-busy={creating}
            style={{ background: '#2563eb', border: 'none', color: '#fff', borderRadius: 6, padding: '0.45rem 1.2rem', fontSize: '0.82rem', fontWeight: 600, fontFamily: ui, cursor: !title.trim() || creating ? 'not-allowed' : 'pointer', opacity: !title.trim() || creating ? 0.5 : 1 }}
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

export function SiteEditorClient({ initialPages }: { initialPages: SitePage[] }) {
  const [pages, setPages] = useState<SitePage[]>(initialPages)
  const [activeTab, setActiveTab] = useState<'pages' | 'styles' | 'settings'>('pages')
  const [showModal, setShowModal] = useState(false)

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

  const inMenu = pages.filter(p => p.showInNav)
  const notInMenu = pages.filter(p => !p.showInNav)

  const tabs: { id: 'pages' | 'styles' | 'settings'; icon: React.ReactNode; label: string }[] = [
    { id: 'pages', icon: <GlobeIcon />, label: 'Pages' },
    { id: 'styles', icon: <StylesIcon />, label: 'Styles' },
    { id: 'settings', icon: <SettingsIcon />, label: 'Settings' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0e0e0e', color: '#e6e1de' }}>

      {showModal && <NewPageModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); reload() }} />}

      {/* ---- Left sidebar ---- */}
      <div style={{ width: 260, flexShrink: 0, background: '#111', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', height: '100vh' }}>

        {/* Brand header */}
        <div style={{ padding: '1rem 1rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ margin: 0, fontFamily: ui, fontSize: '0.72rem', fontWeight: 600, color: '#3a3a3a', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Tynnell Hollins</p>
          <p style={{ margin: '0.2rem 0 0', fontFamily: ui, fontSize: '0.8rem', fontWeight: 500, color: '#9b9a9a' }}>Website Editor</p>
        </div>

        {/* Tab icons */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 0.5rem' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              aria-pressed={activeTab === t.id}
              title={t.label}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.7rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === t.id ? '#e6e1de' : '#3a3a3a', borderBottom: `2px solid ${activeTab === t.id ? '#e6e1de' : 'transparent'}`, transition: 'color 0.12s, border-color 0.12s' }}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Pages tab content */}
        {activeTab === 'pages' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.5rem' }}>

            {/* Add Page button */}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.75rem', background: 'none', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 7, color: '#5a5a5a', fontSize: '0.8rem', fontFamily: ui, cursor: 'pointer', marginBottom: '1rem', transition: 'border-color 0.12s, color 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)'; (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = '#5a5a5a' }}
            >
              <PlusIcon /> Add Page
            </button>

            {/* SITE MENU */}
            <p style={{ margin: '0 0 0.4rem 0.75rem', fontFamily: mono, fontSize: '0.6rem', letterSpacing: '0.14em', color: '#3a3a3a', textTransform: 'uppercase' }}>Site Menu</p>
            {inMenu.length > 0
              ? inMenu.map(p => (
                  <PageRow key={String(p.id)} page={p} onDelete={deletePage} onToggleNav={toggleNav} onRefresh={reload} />
                ))
              : <p style={{ margin: '0 0 0.75rem 0.75rem', fontFamily: mono, fontSize: '0.72rem', color: '#2a2a2a' }}>No pages in menu</p>
            }

            {/* NOT IN MENU */}
            {notInMenu.length > 0 && (
              <>
                <p style={{ margin: '1rem 0 0.4rem 0.75rem', fontFamily: mono, fontSize: '0.6rem', letterSpacing: '0.14em', color: '#3a3a3a', textTransform: 'uppercase' }}>Not in Menu</p>
                {notInMenu.map(p => (
                  <PageRow key={String(p.id)} page={p} onDelete={deletePage} onToggleNav={toggleNav} onRefresh={reload} />
                ))}
              </>
            )}

            {pages.length === 0 && (
              <p style={{ fontFamily: mono, fontSize: '0.75rem', color: '#2a2a2a', padding: '0 0.75rem' }}>No pages yet. Click "Add Page" to create one.</p>
            )}
          </div>
        )}

        {/* Styles tab */}
        {activeTab === 'styles' && (
          <div style={{ flex: 1, padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0, fontFamily: ui, fontSize: '0.85rem', color: '#9b9a9a' }}>Design tokens and global styles are managed in code.</p>
            <a href="/admin/globals/site-config" style={{ color: '#2563eb', fontSize: '0.8rem', fontFamily: ui }}>Open Site Config</a>
          </div>
        )}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <div style={{ flex: 1, padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a href="/admin/globals/site-config" style={{ color: '#c4bfb9', textDecoration: 'none', fontFamily: ui, fontSize: '0.85rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Site Config</a>
            <a href="/admin/globals/hero-slides" style={{ color: '#c4bfb9', textDecoration: 'none', fontFamily: ui, fontSize: '0.85rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Hero Slides</a>
            <a href="/admin/globals/about-page" style={{ color: '#c4bfb9', textDecoration: 'none', fontFamily: ui, fontSize: '0.85rem', padding: '0.5rem 0' }}>About Page</a>
          </div>
        )}

        {/* Bottom: Preview + Publish + Back */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0.75rem 0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <a
              href="https://tynnellhollinsphotography.com" target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.5rem', background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#9b9a9a', fontSize: '0.78rem', fontFamily: ui, textDecoration: 'none', transition: 'border-color 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)' }}
            >
              Preview <ExternalIcon />
            </a>
          </div>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/admin"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.4rem 0.5rem', color: '#2e2e2e', fontSize: '0.75rem', fontFamily: ui, textDecoration: 'none', borderRadius: 6, transition: 'color 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#5a5a5a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#2e2e2e' }}
          >
            <DashboardIcon /> Back to Dashboard
          </a>
        </div>
      </div>

      {/* ---- Right: main content ---- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', background: '#0a0a0a' }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <GlobeIcon />
          </div>
          <h1 style={{ fontFamily: ui, fontSize: '1.4rem', fontWeight: 600, color: '#d6d1ce', margin: '0 0 0.75rem' }}>Website Editor</h1>
          <p style={{ fontFamily: mono, fontSize: '0.78rem', color: '#4a4a4a', margin: '0 0 2rem', lineHeight: 1.7 }}>
            Select a page from the sidebar to open it in the visual builder, or click "Add Page" to create a new one.
          </p>
          <button
            type="button" onClick={() => setShowModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#2563eb', border: 'none', color: '#fff', borderRadius: 7, padding: '0.65rem 1.4rem', fontSize: '0.85rem', fontWeight: 600, fontFamily: ui, cursor: 'pointer' }}
          >
            <PlusIcon /> Add Page
          </button>
        </div>
      </div>
    </div>
  )
}
