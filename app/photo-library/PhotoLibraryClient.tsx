'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import type { LibraryPhoto } from './page'

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CollectionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function LibraryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 9v12" />
    </svg>
  )
}

function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Upload logic (presign -> R2 -> ingest)
// ---------------------------------------------------------------------------

type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; done: number; total: number; errors: string[] }
  | { phase: 'done'; uploaded: number; errors: string[] }

async function uploadFile(file: File, category: string | null): Promise<void> {
  const presignRes = await fetch('/api/upload-presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  })
  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Failed to get upload URL')
  }
  const { uploadUrl, key } = await presignRes.json() as { uploadUrl: string; key: string }

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!putRes.ok) throw new Error('Upload to storage failed')

  const ingestRes = await fetch('/api/photos/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, filename: file.name, contentType: file.type, category }),
  })
  if (!ingestRes.ok) {
    const err = await ingestRes.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Ingest failed')
  }
}

// ---------------------------------------------------------------------------
// Date grouping
// ---------------------------------------------------------------------------

function groupByMonth(photos: LibraryPhoto[]): { label: string; photos: LibraryPhoto[] }[] {
  const map = new Map<string, LibraryPhoto[]>()
  for (const p of photos) {
    const d = new Date(p.createdAt)
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const existing = map.get(label)
    if (existing) existing.push(p)
    else map.set(label, [p])
  }
  return Array.from(map.entries()).map(([label, photos]) => ({ label, photos }))
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function Sidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (t: string) => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  return (
    <aside style={{
      width: 240,
      minWidth: 240,
      background: '#0f0f0f',
      borderRight: '1px solid #1e1e1e',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      {/* Brand / product switcher */}
      <div style={{ padding: '20px 20px 8px', borderBottom: '1px solid #1e1e1e', position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%',
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #2dd4bf, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e6e1de', letterSpacing: 0.2, flex: 1, textAlign: 'left' }}>Client Gallery</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {dropdownOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 12, right: 12, zIndex: 50,
            background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            padding: '6px 0', marginTop: 4,
          }}>
            {[
              { label: 'Studio', href: '/studio', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
              { label: 'Client Gallery', href: '/photo-library', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/></svg>, active: true },
              { label: 'Website Builder', href: '/builder', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
              { label: 'Admin', href: '/admin', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 14px', textDecoration: 'none',
                  color: item.active ? '#2dd4bf' : '#b0aba8',
                  fontSize: 13, fontWeight: item.active ? 600 : 400,
                  background: item.active ? 'rgba(45,212,191,0.08)' : 'transparent',
                }}
              >
                {item.icon}
                {item.label}
                {item.active && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 'auto' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        <NavItem
          icon={<CollectionsIcon />}
          label="Collections"
          href="/gallery-editor"
          active={activeTab === 'collections'}
        />
        <NavItem
          icon={<LibraryIcon />}
          label="Library"
          href="/photo-library"
          active={activeTab === 'library'}
        />
        <NavItem
          icon={<StarIcon />}
          label="Starred"
          active={activeTab === 'starred'}
          onClick={() => onTabChange('starred')}
        />

        <div style={{ margin: '16px 8px 6px', fontSize: 10, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>
          Tools
        </div>
        <NavItem
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}
          label="Marketing"
          active={false}
          onClick={() => {}}
        />
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e1e' }}>
        <Link href="/studio" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#666', fontSize: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </aside>
  )
}

function NavItem({
  icon, label, href, active, onClick
}: {
  icon: React.ReactNode
  label: string
  href?: string
  active: boolean
  onClick?: () => void
}) {
  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? '#e6e1de' : '#777',
    background: active ? '#1e1e1e' : 'transparent',
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    marginBottom: 2,
    transition: 'background 0.15s, color 0.15s',
  }

  if (href) {
    return (
      <Link href={href} style={style}>
        {icon}
        {label}
      </Link>
    )
  }
  return (
    <button type="button" style={style} onClick={onClick}>
      {icon}
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Photo card
// ---------------------------------------------------------------------------

function PhotoCard({ photo, selected, onSelect }: {
  photo: LibraryPhoto
  selected: boolean
  onSelect: (id: number) => void
}) {
  const [hovered, setHovered] = useState(false)
  const src = photo.cardUrl ?? photo.thumbUrl ?? photo.url

  return (
    <div
      style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', aspectRatio: '4/3', background: '#1a1a1a' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(photo.id)}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={photo.filename ?? ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
      )}

      {/* Checkbox overlay */}
      {(hovered || selected) && (
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 4,
            background: selected ? '#2dd4bf' : 'rgba(0,0,0,0.5)',
            border: selected ? '2px solid #2dd4bf' : '2px solid rgba(255,255,255,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {selected && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Featured star */}
      {photo.featured && (
        <div style={{ position: 'absolute', top: 8, right: 8, color: '#facc15' }}>
          <StarIcon filled />
        </div>
      )}

      {/* Hover info bar */}
      {hovered && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          padding: '16px 8px 6px',
        }}>
          <p style={{ margin: 0, fontSize: 11, color: '#e6e1de', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {photo.filename}
          </p>
          {photo.category && (
            <p style={{ margin: '2px 0 0', fontSize: 10, color: '#9b9a9a', textTransform: 'capitalize' }}>
              {photo.category}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Drop zone overlay
// ---------------------------------------------------------------------------

function DropOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(45,212,191,0.1)',
      border: '2px dashed #2dd4bf',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{ textAlign: 'center', color: '#2dd4bf' }}>
        <UploadIcon />
        <p style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 600 }}>Drop photos to upload</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main client
// ---------------------------------------------------------------------------

const CATEGORIES = ['All', 'Weddings', 'Portraits', 'Families', 'Couples', 'Brands']

export function PhotoLibraryClient({ initialPhotos }: { initialPhotos: LibraryPhoto[] }) {
  const [photos, setPhotos] = useState<LibraryPhoto[]>(initialPhotos)
  const [activeTab, setActiveTab] = useState('library')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [uploadState, setUploadState] = useState<UploadState>({ phase: 'idle' })
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCountRef = useRef(0)

  const filtered = useMemo(() => {
    let list = photos
    if (activeTab === 'starred') list = list.filter(p => p.featured)
    if (category !== 'All') list = list.filter(p => p.category?.toLowerCase() === category.toLowerCase())
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => p.filename?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))
    }
    return list
  }, [photos, activeTab, category, search])

  const groups = useMemo(() => groupByMonth(filtered), [filtered])

  const toggleSelect = useCallback((id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const runUpload = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) return

    setUploadState({ phase: 'uploading', done: 0, total: imageFiles.length, errors: [] })
    const errors: string[] = []
    let done = 0

    for (const file of imageFiles) {
      try {
        const cat = category !== 'All' ? category.toLowerCase() : null
        await uploadFile(file, cat)
        done++
        setUploadState({ phase: 'uploading', done, total: imageFiles.length, errors: [...errors] })
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : 'failed'}`)
      }
    }

    setUploadState({ phase: 'done', uploaded: done, errors })

    // Refresh photo list
    const res = await fetch('/api/photos?limit=500&depth=0&sort=-createdAt')
    if (res.ok) {
      const data = await res.json() as { docs?: LibraryPhoto[] }
      if (data.docs) setPhotos(data.docs)
    }

    setTimeout(() => setUploadState({ phase: 'idle' }), 3000)
  }, [category])

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCountRef.current++
    setDragging(true)
  }, [])

  const onDragLeave = useCallback(() => {
    dragCountRef.current--
    if (dragCountRef.current === 0) setDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCountRef.current = 0
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    void runUpload(files)
  }, [runUpload])

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    void runUpload(files)
    e.target.value = ''
  }, [runUpload])

  return (
    <div
      style={{ display: 'flex', minHeight: '100vh', background: '#111', color: '#e6e1de', fontFamily: 'var(--font-heading, Archivo, sans-serif)' }}
      onDragEnter={onDragEnter}
      onDragOver={e => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {dragging && <DropOverlay />}

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto', height: '100vh' }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 24px', borderBottom: '1px solid #1e1e1e',
          position: 'sticky', top: 0, background: '#111', zIndex: 10,
        }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#e6e1de', flex: 1 }}>Photo Library</h1>

          {/* Search */}
          <div style={{ position: 'relative', width: 280 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search photos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 12px 8px 34px',
                background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6,
                color: '#e6e1de', fontSize: 13, outline: 'none',
              }}
            />
          </div>

          {/* Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadState.phase === 'uploading'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: '#2dd4bf', color: '#000', fontSize: 13, fontWeight: 600,
              opacity: uploadState.phase === 'uploading' ? 0.6 : 1,
            }}
          >
            <UploadIcon />
            {uploadState.phase === 'uploading'
              ? `Uploading ${uploadState.done}/${uploadState.total}...`
              : 'Upload Photos'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onFileInput} style={{ display: 'none' }} />
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 24px', borderBottom: '1px solid #1e1e1e', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              style={{
                padding: '5px 14px', borderRadius: 20, border: '1px solid',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                background: category === cat ? '#2dd4bf' : 'transparent',
                borderColor: category === cat ? '#2dd4bf' : '#333',
                color: category === cat ? '#000' : '#9b9a9a',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCategory('Starred')}
            style={{
              marginLeft: 'auto',
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 14px', borderRadius: 20, border: '1px solid',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: category === 'Starred' ? '#facc15' : 'transparent',
              borderColor: category === 'Starred' ? '#facc15' : '#333',
              color: category === 'Starred' ? '#000' : '#9b9a9a',
            }}
          >
            <StarIcon filled={category === 'Starred'} />
            Featured
          </button>
        </div>

        {/* Upload feedback */}
        {uploadState.phase === 'done' && (
          <div style={{
            margin: '12px 24px', padding: '10px 16px', borderRadius: 6,
            background: uploadState.errors.length ? '#451a1a' : '#1a2e1a',
            border: `1px solid ${uploadState.errors.length ? '#7f1d1d' : '#166534'}`,
            fontSize: 13, color: uploadState.errors.length ? '#fca5a5' : '#86efac',
          }}>
            {uploadState.uploaded > 0 && `${uploadState.uploaded} photo${uploadState.uploaded !== 1 ? 's' : ''} uploaded.`}
            {uploadState.errors.length > 0 && (
              <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                {uploadState.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}

        {/* Drag hint */}
        {photos.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#555', gap: 12 }}>
            <UploadIcon />
            <p style={{ margin: 0, fontSize: 15 }}>Drag photos here or click Upload Photos</p>
          </div>
        ) : (
          <div style={{ padding: '24px', flex: 1 }}>
            {/* Selection bar */}
            {selected.size > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', marginBottom: 20, borderRadius: 8,
                background: '#1e1e1e', border: '1px solid #2a2a2a',
              }}>
                <span style={{ fontSize: 13, color: '#e6e1de' }}>{selected.size} selected</span>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#9b9a9a', fontSize: 12, cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>
            )}

            {groups.length === 0 ? (
              <p style={{ color: '#555', fontSize: 14 }}>No photos match your filters.</p>
            ) : (
              groups.map(group => (
                <div key={group.label} style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#9b9a9a', letterSpacing: 0.5 }}>
                      {group.label.toUpperCase()}
                    </h2>
                    <span style={{ fontSize: 12, color: '#444' }}>{group.photos.length} photos</span>
                    <div style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 6,
                  }}>
                    {group.photos.map(p => (
                      <PhotoCard
                        key={p.id}
                        photo={p}
                        selected={selected.has(p.id)}
                        onSelect={toggleSelect}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Drop hint at bottom */}
            <div style={{
              marginTop: 24, border: '2px dashed #222', borderRadius: 8,
              padding: '32px', textAlign: 'center', color: '#444',
            }}>
              <p style={{ margin: 0, fontSize: 13 }}>Drag photos here to upload to this library</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
