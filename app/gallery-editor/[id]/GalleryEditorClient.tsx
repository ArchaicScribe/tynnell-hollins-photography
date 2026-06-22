'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { isUnsupportedImage, uploadPhotoToLibrary } from '@/app/lib/uploadPhoto'
import type { PhotoItem, GalleryListItem } from './page'

const CATEGORIES = ['weddings', 'portraits', 'families', 'couples', 'brands'] as const

type Props = {
  galleryId: number
  initialTitle: string
  initialSlug: string | null
  initialCategory: string
  initialStatus: string
  initialTapedStyle: boolean
  initialFeatured: boolean
  initialCoverId: number | null
  initialCoverThumb: string | null
  initialHeroUrl: string | null
  initialPhotos: PhotoItem[]
  allGalleries: GalleryListItem[]
}

export function GalleryEditorClient({
  galleryId,
  initialTitle,
  initialSlug,
  initialCategory,
  initialStatus,
  initialTapedStyle,
  initialFeatured,
  initialCoverId,
  initialCoverThumb,
  initialHeroUrl,
  initialPhotos,
  allGalleries,
}: Props) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos)
  const [title, setTitle] = useState(initialTitle)
  const [category, setCategory] = useState(initialCategory)
  const [status, setStatus] = useState(initialStatus)
  const [tapedStyle, setTapedStyle] = useState(initialTapedStyle)
  const [featured, setFeatured] = useState(initialFeatured)
  const [coverId, setCoverId] = useState<number | null>(initialCoverId)
  const [coverThumb, setCoverThumb] = useState<string | null>(initialCoverThumb)
  const [heroUrl, setHeroUrl] = useState<string | null>(initialHeroUrl)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [error, setError] = useState('')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [fileOver, setFileOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [sidebarSection, setSidebarSection] = useState<'galleries' | 'settings'>('galleries')
  const [showNewModal, setShowNewModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<string>('portraits')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const markChanged = () => setHasChanges(true)

  const createGallery = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), category: newCategory, status: 'draft' }),
      })
      if (res.ok) {
        const data = await res.json() as { doc?: { id: number } }
        const id = data.doc?.id
        if (id) window.location.href = `/gallery-editor/${id}`
      } else {
        setCreateError('Could not create gallery. Please try again.')
      }
    } catch {
      setCreateError('Could not create gallery. Check your connection.')
    }
    setCreating(false)
  }

  const setField = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    markChanged()
  }

  const move = (from: number, to: number) => {
    if (from === to) return
    const next = [...photos]
    const [m] = next.splice(from, 1)
    next.splice(to, 0, m)
    setPhotos(next)
    markChanged()
  }

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    markChanged()
  }

  const setCover = (photo: PhotoItem) => {
    setCoverId(photo.id)
    setCoverThumb(photo.thumbUrl ?? photo.url)
    setHeroUrl(photo.url)
    markChanged()
  }

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    setUploadError('')
    const all = Array.from(fileList)
    const accepted: File[] = []
    let rejected = 0
    for (const f of all) {
      if (isUnsupportedImage(f) || !f.type.startsWith('image/')) rejected++
      else accepted.push(f)
    }
    if (rejected > 0) setUploadError(`${rejected} file${rejected !== 1 ? 's' : ''} skipped (HEIC not supported - export as JPEG first).`)
    if (!accepted.length) return
    setUploading(true)
    setUploadProgress({ done: 0, total: accepted.length })
    const newPhotos: PhotoItem[] = []
    for (let i = 0; i < accepted.length; i++) {
      try {
        const doc = await uploadPhotoToLibrary(accepted[i], { category })
        newPhotos.push({
          id: doc.id,
          url: doc.sizes?.card?.url ?? doc.url ?? null,
          thumbUrl: doc.sizes?.thumbnail?.url ?? doc.sizes?.card?.url ?? doc.url ?? null,
          alt: doc.alt ?? null,
          filename: doc.filename ?? null,
          category: doc.category ?? null,
        })
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : 'Upload failed.')
      }
      setUploadProgress({ done: i + 1, total: accepted.length })
    }
    if (newPhotos.length) {
      setPhotos(prev => [...prev, ...newPhotos])
      markChanged()
    }
    setUploading(false)
    setUploadProgress(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  const save = async (newStatus?: string) => {
    setSaving(true)
    setError('')
    const targetStatus = newStatus ?? status
    try {
      const res = await fetch(`/api/galleries/${galleryId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          status: targetStatus,
          featured,
          tapedStyle,
          coverPhoto: coverId,
          photos: photos.map(p => ({ photo: p.id })),
        }),
      })
      if (res.ok) {
        setHasChanges(false)
        if (newStatus) setStatus(newStatus)
        if (saveMsgTimer.current) clearTimeout(saveMsgTimer.current)
        setSaveMsg(newStatus === 'published' ? 'Published!' : 'Saved')
        saveMsgTimer.current = setTimeout(() => setSaveMsg(''), 2500)
      } else {
        setError('Save failed. Please try again.')
      }
    } catch {
      setError('Save failed. Check your connection.')
    }
    setSaving(false)
  }

  useEffect(() => () => { if (saveMsgTimer.current) clearTimeout(saveMsgTimer.current) }, [])

  const font = "var(--font-heading, Archivo, sans-serif)"
  const mono = "var(--font-body, 'Roboto Mono', monospace)"
  // UI chrome uses Archivo (clean sans-serif) to match the Pixieset aesthetic
  const ui = font

  const isDraft = status === 'draft'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#141414', overflow: 'hidden' }}>

      {/* New gallery modal */}
      {showNewModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-gallery-title"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewModal(false) }}
          onKeyDown={e => { if (e.key === 'Escape') setShowNewModal(false) }}
        >
          <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '2rem', width: 380, display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <h2 id="new-gallery-title" style={{ margin: 0, fontFamily: ui, fontSize: '1.1rem', fontWeight: 600, color: '#e6e1de', letterSpacing: '-0.01em' }}>Create new gallery</h2>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#9b9a9a', fontFamily: ui }}>Gallery name</span>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void createGallery() }}
                placeholder="e.g. Smith Wedding"
                autoFocus
                style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '0.6rem 0.75rem', color: '#e6e1de', fontSize: '0.9rem', outline: 'none', fontFamily: ui }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#9b9a9a', fontFamily: ui }}>Category</span>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '0.6rem 0.75rem', color: '#e6e1de', fontSize: '0.9rem', outline: 'none', fontFamily: ui, cursor: 'pointer' }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </label>
            {createError && <p role="alert" style={{ margin: 0, fontSize: '0.78rem', color: '#f0a3a3', fontFamily: ui }}>{createError}</p>}
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
              <button type="button" onClick={() => setShowNewModal(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#9b9a9a', borderRadius: 6, padding: '0.5rem 1.1rem', fontSize: '0.85rem', cursor: 'pointer', fontFamily: ui, fontWeight: 500 }}>Cancel</button>
              <button type="button" onClick={() => void createGallery()} disabled={!newTitle.trim() || creating} aria-busy={creating} style={{ background: '#1db954', border: 'none', color: '#fff', borderRadius: 6, padding: '0.5rem 1.3rem', fontSize: '0.85rem', fontWeight: 600, cursor: (!newTitle.trim() || creating) ? 'not-allowed' : 'pointer', fontFamily: ui, opacity: (!newTitle.trim() || creating) ? 0.5 : 1 }}>
                {creating ? 'Creating...' : 'Create gallery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 1.25rem', height: 54, borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0e0e0e', flexShrink: 0 }}>
        <Link href="/gallery-editor" style={{ color: '#6b6a6a', textDecoration: 'none', fontSize: '0.82rem', fontFamily: ui, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span aria-hidden="true" style={{ fontSize: '1rem', lineHeight: 1 }}>&#8592;</span> Galleries
        </Link>
        <span aria-hidden="true" style={{ color: 'rgba(255,255,255,0.1)', flexShrink: 0, fontSize: '1.1rem', fontWeight: 300 }}>/</span>
        <span style={{ fontFamily: ui, fontSize: '0.9rem', fontWeight: 600, color: '#d6d1ce', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, letterSpacing: '-0.01em' }}>{title}</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 20, background: isDraft ? 'rgba(155,154,154,0.12)' : 'rgba(29,185,84,0.15)', color: isDraft ? '#6b6a6a' : '#1db954', border: `1px solid ${isDraft ? 'rgba(155,154,154,0.15)' : 'rgba(29,185,84,0.3)'}`, flexShrink: 0, fontFamily: ui }}>
          {isDraft ? 'Draft' : 'Published'}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
          {saveMsg && <span style={{ fontSize: '0.78rem', color: '#1db954', fontFamily: ui, fontWeight: 500 }}>{saveMsg}</span>}
          {error && <span role="alert" style={{ fontSize: '0.78rem', color: '#f0a3a3', fontFamily: ui }}>{error}</span>}
          {initialSlug && (
            <a href={`/portfolio/${initialSlug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', fontWeight: 500, color: '#9b9a9a', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem 0.75rem', borderRadius: 6, whiteSpace: 'nowrap', fontFamily: ui }}>
              View on site <span aria-hidden="true">&#8599;</span>
            </a>
          )}
        </div>
      </header>

      {/* Body: sidebar + canvas */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT SIDEBAR */}
        <aside style={{ width: 260, flexShrink: 0, background: '#0e0e0e', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, padding: '0 0.5rem' }}>
            {(['galleries', 'settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSidebarSection(tab)}
                style={{ flex: 1, padding: '0.8rem 0.5rem', background: 'none', border: 'none', borderBottom: `2px solid ${sidebarSection === tab ? '#1db954' : 'transparent'}`, color: sidebarSection === tab ? '#e6e1de' : '#4b4b4b', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.02em', cursor: 'pointer', fontFamily: ui, transition: 'color .12s, border-color .12s', marginBottom: '-1px' }}
                aria-pressed={sidebarSection === tab}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Gallery list */}
          {sidebarSection === 'galleries' && (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0.65rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3a3a3a', fontFamily: ui }}>All Galleries</span>
                <button
                  type="button"
                  onClick={() => { setNewTitle(''); setCreateError(''); setShowNewModal(true) }}
                  style={{ background: 'none', border: 'none', color: '#1db954', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: ui, display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.1rem 0.25rem' }}
                  aria-label="New gallery"
                >
                  + Add
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0' }}>
              {allGalleries.map(g => {
                const isCurrent = g.id === galleryId
                return (
                  <a
                    key={g.id}
                    href={`/gallery-editor/${g.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.45rem 0.75rem', textDecoration: 'none', background: isCurrent ? 'rgba(29,185,84,0.08)' : 'transparent', borderLeft: `2px solid ${isCurrent ? '#1db954' : 'transparent'}`, transition: 'background .1s' }}
                  >
                    {g.coverThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.coverThumb} alt="" style={{ width: 38, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 38, height: 28, borderRadius: 4, background: '#1e1e1e', flexShrink: 0, border: '1px solid rgba(255,255,255,0.06)' }} />
                    )}
                    <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: isCurrent ? 600 : 400, color: isCurrent ? '#e6e1de' : '#9b9a9a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: ui, lineHeight: 1.3 }}>{g.title}</div>
                      <div style={{ fontSize: '0.67rem', color: '#3a3a3a', display: 'flex', gap: '0.35rem', marginTop: '0.1rem', fontFamily: ui }}>
                        {g.status === 'draft' && <span style={{ color: '#5a5a5a' }}>Draft</span>}
                        {g.photoCount != null && g.photoCount > 0 && <span>{g.photoCount} photo{g.photoCount !== 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                  </a>
                )
              })}
              </div>
            </div>
          )}

          {/* Settings panel */}
          {sidebarSection === 'settings' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#6b6a6a', fontFamily: ui }}>Gallery name</span>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setField(setTitle)(e.target.value)}
                    style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '0.5rem 0.65rem', color: '#e6e1de', fontSize: '0.875rem', outline: 'none', fontFamily: ui }}
                    aria-label="Gallery title"
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#6b6a6a', fontFamily: ui }}>Category</span>
                  <select
                    value={category}
                    onChange={e => setField(setCategory)(e.target.value)}
                    style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '0.5rem 0.65rem', color: '#e6e1de', fontSize: '0.875rem', outline: 'none', fontFamily: ui, cursor: 'pointer' }}
                    aria-label="Gallery category"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#6b6a6a', fontFamily: ui }}>Visibility</span>
                  <select
                    value={status}
                    onChange={e => setField(setStatus)(e.target.value)}
                    style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '0.5rem 0.65rem', color: '#e6e1de', fontSize: '0.875rem', outline: 'none', fontFamily: ui, cursor: 'pointer' }}
                    aria-label="Gallery status"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft (hidden)</option>
                  </select>
                </label>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0.1rem 0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={tapedStyle}
                      onChange={e => setField(setTapedStyle)(e.target.checked)}
                      style={{ width: 15, height: 15, accentColor: '#1db954', cursor: 'pointer', flexShrink: 0 }}
                      aria-label="Taped photo style"
                    />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#d6d1ce', fontFamily: ui }}>Taped style</div>
                      <div style={{ fontSize: '0.7rem', color: '#4b4b4b', fontFamily: ui, marginTop: '0.1rem' }}>Editorial look with tape corners</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={e => setField(setFeatured)(e.target.checked)}
                      style={{ width: 15, height: 15, accentColor: '#1db954', cursor: 'pointer', flexShrink: 0 }}
                      aria-label="Featured on homepage"
                    />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#d6d1ce', fontFamily: ui }}>Featured on homepage</div>
                      <div style={{ fontSize: '0.7rem', color: '#4b4b4b', fontFamily: ui, marginTop: '0.1rem' }}>Show in homepage portfolio section</div>
                    </div>
                  </label>
                </div>

                {coverThumb && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 500, color: '#6b6a6a', fontFamily: ui, marginBottom: '0.5rem' }}>Cover photo</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverThumb} alt="Cover" style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(201,162,39,0.35)' }} />
                    <div style={{ fontSize: '0.68rem', color: '#4b4b4b', fontFamily: ui, marginTop: '0.4rem', lineHeight: 1.4 }}>Hover a photo and click Set as cover to change.</div>
                  </div>
                )}
              </div>
            </div>
          )}

        </aside>

        {/* MAIN CANVAS */}
        <main
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: '#111', position: 'relative' }}
          onDragOver={e => {
            if (Array.from(e.dataTransfer.types).includes('Files')) {
              e.preventDefault()
              if (!fileOver) setFileOver(true)
            }
          }}
          onDragLeave={e => { if (e.currentTarget === e.target) setFileOver(false) }}
          onDrop={e => {
            if (e.dataTransfer.files?.length) { e.preventDefault(); void handleFiles(e.dataTransfer.files) }
            setFileOver(false)
          }}
        >
          {/* File drop overlay */}
          {fileOver && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', outline: '3px dashed #1db954', outlineOffset: '-16px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e6e1de', fontFamily: ui }}>
                Drop photos to add to gallery
              </div>
            </div>
          )}

          {/* Hero section */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/7', background: '#1a1a1a', overflow: 'hidden' }}>
            {heroUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '0.8rem', fontFamily: mono }}>
                No cover photo set
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} aria-hidden="true" />
            <div style={{ position: 'absolute', bottom: '2rem', left: '2.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(230,225,222,0.65)', fontFamily: mono }}>{category}</p>
              <h1 style={{ margin: '0.25rem 0 0.4rem', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontFamily: font, color: '#e6e1de', fontWeight: 400, letterSpacing: '0.02em' }}>{title}</h1>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(230,225,222,0.55)', fontFamily: mono }}>{photos.length} photos</p>
            </div>
          </div>

          {/* Photo grid label */}
          <div style={{ padding: '1.25rem 2rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 500, color: '#4b4b4b', fontFamily: ui }}>
              {photos.length > 0
                ? `${photos.length} photo${photos.length !== 1 ? 's' : ''} - drag to reorder`
                : 'No photos yet'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {uploadProgress && (
                <span style={{ fontSize: '0.78rem', color: '#6b6a6a', fontFamily: ui }}>
                  Uploading {uploadProgress.done}/{uploadProgress.total}...
                </span>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-busy={uploading}
                style={{ background: '#1db954', border: 'none', color: '#fff', borderRadius: 6, padding: '0.42rem 0.9rem', fontSize: '0.8rem', fontWeight: 600, cursor: uploading ? 'wait' : 'pointer', fontFamily: ui, opacity: uploading ? 0.6 : 1 }}
              >
                + Upload photos
              </button>
            </div>
          </div>

          {uploadError && (
            <div role="alert" style={{ margin: '0 2rem 0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 6, fontSize: '0.78rem', color: '#f0a3a3', fontFamily: ui }}>{uploadError}</div>
          )}

          {/* The photo grid - this is the main editing surface */}
          <div style={{ padding: '0 2rem 4rem' }}>
            {photos.length === 0 ? (
              <div style={{ border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 10, padding: '5rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', opacity: 0.15, marginBottom: '1rem' }} aria-hidden="true">&#128444;</div>
                <p style={{ color: '#4b4b4b', fontFamily: ui, fontWeight: 500, fontSize: '0.88rem', margin: 0 }}>
                  Drag photos here, or click Upload photos above
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: tapedStyle
                  ? 'repeat(auto-fill, minmax(220px, 1fr))'
                  : 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: tapedStyle ? '2rem' : '0.5rem',
              }}>
                {photos.map((photo, i) => {
                  const isDragging = dragIdx === i
                  const isOver = overIdx === i && dragIdx !== null && dragIdx !== i
                  const isHovered = hoveredIdx === i
                  const isCover = photo.id === coverId

                  if (tapedStyle) {
                    return (
                      <div
                        key={photo.id}
                        draggable
                        onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragIdx(i) }}
                        onDragEnter={() => { if (dragIdx !== null && dragIdx !== i) setOverIdx(i) }}
                        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                        onDrop={e => { e.preventDefault(); move(dragIdx!, i); setDragIdx(null); setOverIdx(null) }}
                        onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        style={{
                          cursor: isDragging ? 'grabbing' : 'grab',
                          opacity: isDragging ? 0.3 : 1,
                          transform: `rotate(${(i % 5 - 2) * 1.2}deg) ${isOver ? 'scale(1.04)' : 'scale(1)'}`,
                          transition: 'opacity .12s, transform .15s',
                          position: 'relative',
                        }}
                      >
                        {/* Tape corners */}
                        {[{ top: '-6px', left: '20%', rotate: '-35deg' }, { top: '-6px', right: '20%', rotate: '35deg' }, { bottom: '-6px', left: '20%', rotate: '35deg' }, { bottom: '-6px', right: '20%', rotate: '-35deg' }].map((pos, t) => (
                          <div key={t} aria-hidden="true" style={{ position: 'absolute', width: 36, height: 12, background: 'rgba(214,209,206,0.42)', transform: `rotate(${pos.rotate})`, zIndex: 2, ...Object.fromEntries(Object.entries(pos).filter(([k]) => k !== 'rotate')) }} />
                        ))}
                        <div style={{ background: 'var(--tape-mat, #f4efe8)', padding: '0.75rem 0.75rem 2.5rem', boxShadow: 'var(--tape-shadow, 0 4px 16px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2))', position: 'relative' }}>
                          <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                            {photo.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={photo.url} alt={photo.alt ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: '#e8e3dc' }} />
                            )}
                            {/* Controls overlay */}
                            {(isHovered || isCover) && (
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {isCover ? (
                                  <span style={{ fontSize: '0.65rem', color: 'rgba(201,162,39,0.95)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                    <span aria-hidden="true">&#9733; </span>Cover
                                  </span>
                                ) : (
                                  <button type="button" onClick={() => setCover(photo)} style={{ fontSize: '0.65rem', color: '#fff', background: 'none', border: '1px solid rgba(255,255,255,0.4)', padding: '0.2rem 0.5rem', borderRadius: 3, cursor: 'pointer' }}>Set cover</button>
                                )}
                                <button type="button" onClick={() => removePhoto(i)} aria-label="Remove" style={{ fontSize: '0.75rem', color: '#fff', background: 'rgba(0,0,0,0.5)', border: 'none', width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                              </div>
                            )}
                          </div>
                        </div>
                        {isOver && <div style={{ position: 'absolute', inset: -4, border: '2px dashed rgba(214,209,206,0.8)', borderRadius: 4, pointerEvents: 'none' }} aria-hidden="true" />}
                      </div>
                    )
                  }

                  return (
                    <div
                      key={photo.id}
                      draggable
                      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragIdx(i) }}
                      onDragEnter={() => { if (dragIdx !== null && dragIdx !== i) setOverIdx(i) }}
                      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                      onDrop={e => { e.preventDefault(); move(dragIdx!, i); setDragIdx(null); setOverIdx(null) }}
                      onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      style={{
                        position: 'relative',
                        aspectRatio: '4/3',
                        overflow: 'hidden',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        opacity: isDragging ? 0.3 : 1,
                        border: `2px solid ${isOver ? 'rgba(214,209,206,0.9)' : isCover ? 'rgba(201,162,39,0.5)' : 'transparent'}`,
                        transition: 'opacity .12s, border-color .1s, transform .1s',
                        transform: isOver ? 'scale(1.02)' : 'scale(1)',
                        background: '#1a1a1a',
                      }}
                    >
                      {photo.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo.url} alt={photo.alt ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '0.75rem', fontFamily: mono }}>{photo.filename ?? 'Photo'}</div>
                      )}

                      {/* Dark overlay on hover */}
                      <div style={{ position: 'absolute', inset: 0, background: isHovered ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)', transition: 'background .15s', pointerEvents: 'none' }} aria-hidden="true" />

                      {/* Position number */}
                      <span style={{ position: 'absolute', top: '0.4rem', left: '0.4rem', fontSize: '0.6rem', fontWeight: 700, background: 'rgba(0,0,0,0.65)', color: '#d6d1ce', padding: '0.15rem 0.35rem', borderRadius: 3 }}>{i + 1}</span>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        aria-label={`Remove photo ${i + 1}`}
                        style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isHovered ? 1 : 0, transition: 'opacity .15s' }}
                      >
                        &times;
                      </button>

                      {/* Cover / set cover */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.4rem 0.6rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isHovered || isCover) ? 1 : 0, transition: 'opacity .15s' }}>
                        {isCover ? (
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(201,162,39,0.95)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            <span aria-hidden="true">&#9733; </span>Cover photo
                          </span>
                        ) : (
                          <button type="button" onClick={() => setCover(photo)} style={{ fontSize: '0.62rem', color: '#d6d1ce', background: 'none', border: '1px solid rgba(214,209,206,0.4)', borderRadius: 3, padding: '0.15rem 0.4rem', cursor: 'pointer' }}>
                            Set as cover
                          </button>
                        )}
                      </div>

                      {/* Drag grip dots */}
                      <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', display: 'grid', gridTemplateColumns: 'repeat(3,4px)', gap: '3px', opacity: isHovered && !isDragging ? 0.7 : 0, transition: 'opacity .15s', pointerEvents: 'none' }}>
                        {Array.from({ length: 9 }).map((_, d) => (
                          <div key={d} style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff' }} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.length) void handleFiles(e.target.files); e.target.value = '' }}
          />
        </main>
      </div>

      {/* BOTTOM BAR */}
      <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: 58, borderTop: '1px solid rgba(255,255,255,0.07)', background: '#0e0e0e', flexShrink: 0 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 500, color: hasChanges ? '#6b6a6a' : '#3a3a3a', fontFamily: ui, transition: 'color .2s' }}>
          {hasChanges ? 'Unsaved changes' : 'All changes saved'}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => void save('draft')}
            disabled={saving}
            aria-busy={saving}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#9b9a9a', borderRadius: 6, padding: '0.5rem 1.2rem', fontSize: '0.82rem', fontWeight: 500, cursor: saving ? 'wait' : 'pointer', fontFamily: ui, opacity: saving ? 0.5 : 1 }}
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => void save('published')}
            disabled={saving}
            aria-busy={saving}
            style={{ background: '#1db954', border: 'none', color: '#fff', borderRadius: 6, padding: '0.5rem 1.4rem', fontSize: '0.82rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: ui, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </footer>
    </div>
  )
}
