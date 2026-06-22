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
  const [slug, setSlug] = useState(initialSlug ?? '')
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
  const [gallerySearch, setGallerySearch] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<string>('portraits')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showLibraryModal, setShowLibraryModal] = useState(false)
  const [libraryPhotos, setLibraryPhotos] = useState<PhotoItem[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryLoaded, setLibraryLoaded] = useState(false)
  const [libraryCategory, setLibraryCategory] = useState<string | null>(null)
  const [librarySearch, setLibrarySearch] = useState('')
  const [librarySelectedIds, setLibrarySelectedIds] = useState<Set<number>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const saveMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const markChanged = () => setHasChanges(true)

  const deleteGallery = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/galleries/${galleryId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        window.location.href = '/gallery-editor'
      } else {
        setShowDeleteConfirm(false)
        setDeleting(false)
      }
    } catch {
      setShowDeleteConfirm(false)
      setDeleting(false)
    }
  }

  const duplicateGallery = async () => {
    setDuplicating(true)
    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${title} (copy)`,
          category,
          tapedStyle,
          status: 'draft',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const newId = data?.doc?.id ?? data?.id
        if (newId) window.location.href = `/gallery-editor/${newId}`
      }
    } catch {
      // ignore
    } finally {
      setDuplicating(false)
    }
  }

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

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const removeSelected = () => {
    setPhotos(prev => prev.filter(p => !selectedIds.has(p.id)))
    setSelectedIds(new Set())
    setSelectMode(false)
    markChanged()
  }

  const loadLibrary = async () => {
    setLibraryLoading(true)
    try {
      const res = await fetch('/api/photos?limit=500&depth=1&sort=-createdAt', { credentials: 'include' })
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await res.json() as { docs: any[] }
        setLibraryPhotos(data.docs.map((p: { id: number; url?: string; sizes?: { card?: { url?: string }; thumbnail?: { url?: string } }; alt?: string; filename?: string; category?: string }) => ({
          id: p.id,
          url: p.sizes?.card?.url ?? p.url ?? null,
          thumbUrl: p.sizes?.thumbnail?.url ?? p.sizes?.card?.url ?? p.url ?? null,
          alt: p.alt ?? null,
          filename: p.filename ?? null,
          category: p.category ?? null,
        })))
        setLibraryLoaded(true)
      }
    } catch {
      // ignore
    }
    setLibraryLoading(false)
  }

  const openLibrary = async () => {
    setShowLibraryModal(true)
    setLibrarySelectedIds(new Set())
    setLibrarySearch('')
    setLibraryCategory(null)
    if (!libraryLoaded) await loadLibrary()
  }

  const toggleLibrarySelect = (id: number) => {
    setLibrarySelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const addFromLibrary = () => {
    const currentIds = new Set(photos.map(p => p.id))
    const toAdd = libraryPhotos.filter(p => librarySelectedIds.has(p.id) && !currentIds.has(p.id))
    if (toAdd.length) {
      setPhotos(prev => [...prev, ...toAdd])
      markChanged()
    }
    setShowLibraryModal(false)
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
      setLibraryLoaded(false)
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
          slug: slug.trim() || undefined,
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

  useEffect(() => () => {
    if (saveMsgTimer.current) clearTimeout(saveMsgTimer.current)
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
  }, [])

  // Auto-save 2.5s after any change (preserves current status)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hasChanges || saving || uploading) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => { void save() }, 2500)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasChanges, title, slug, category, status, featured, tapedStyle, coverId, photos])

  // Warn before closing/navigating away with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanges) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasChanges])

  const font = "var(--font-heading, Archivo, sans-serif)"
  const ui = font

  const isDraft = status === 'draft'

  // Cmd/Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (!saving) void save()
      }
      if (e.key === 'Escape' && selectMode) {
        setSelectMode(false)
        setSelectedIds(new Set())
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, selectMode, title, slug, category, status, featured, tapedStyle, coverId, photos])

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

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-gallery-title"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false) }}
          onKeyDown={e => { if (e.key === 'Escape') setShowDeleteConfirm(false) }}
        >
          <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '2rem', width: 360, display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <h2 id="delete-gallery-title" style={{ margin: 0, fontFamily: ui, fontSize: '1.05rem', fontWeight: 600, color: '#e6e1de', letterSpacing: '-0.01em' }}>Delete gallery?</h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b6a6a', fontFamily: ui, lineHeight: 1.5 }}>
              This removes the gallery from the portfolio. Photos in the library are not deleted.
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#9b9a9a', borderRadius: 6, padding: '0.5rem 1.1rem', fontSize: '0.85rem', cursor: 'pointer', fontFamily: ui, fontWeight: 500 }}>Cancel</button>
              <button type="button" onClick={() => void deleteGallery()} disabled={deleting} aria-busy={deleting} style={{ background: '#c0392b', border: 'none', color: '#fff', borderRadius: 6, padding: '0.5rem 1.3rem', fontSize: '0.85rem', fontWeight: 600, cursor: deleting ? 'wait' : 'pointer', fontFamily: ui, opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Deleting...' : 'Delete gallery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add from library modal */}
      {showLibraryModal && (() => {
        const currentIds = new Set(photos.map(p => p.id))
        const filtered = libraryPhotos.filter(p =>
          (libraryCategory === null || p.category === libraryCategory) &&
          (!librarySearch || (p.filename ?? '').toLowerCase().includes(librarySearch.toLowerCase()) || (p.alt ?? '').toLowerCase().includes(librarySearch.toLowerCase()))
        )
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="library-modal-title"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'stretch', justifyContent: 'center', padding: '2rem' }}
            onClick={e => { if (e.target === e.currentTarget) setShowLibraryModal(false) }}
            onKeyDown={e => { if (e.key === 'Escape') setShowLibraryModal(false) }}
          >
            <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1100, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                <h2 id="library-modal-title" style={{ margin: 0, fontFamily: ui, fontSize: '1rem', fontWeight: 600, color: '#d6d1ce', flex: 1 }}>Add from library</h2>
                <span style={{ fontSize: '0.72rem', color: '#4b4b4b', fontFamily: ui }}>{libraryPhotos.length} photos in library</span>
                <button
                  type="button"
                  onClick={() => void loadLibrary()}
                  disabled={libraryLoading}
                  style={{ background: 'none', border: 'none', color: '#6b6a6a', fontSize: '0.72rem', cursor: libraryLoading ? 'wait' : 'pointer', fontFamily: ui, padding: '0.2rem 0.4rem' }}
                >
                  {libraryLoading ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLibraryModal(false)}
                  aria-label="Close library"
                  style={{ background: 'none', border: 'none', color: '#6b6a6a', fontSize: '1.4rem', cursor: 'pointer', padding: '0.1rem 0.4rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  &times;
                </button>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', flex: 1 }}>
                  <button
                    type="button"
                    onClick={() => setLibraryCategory(null)}
                    aria-pressed={libraryCategory === null}
                    style={{ fontSize: '0.72rem', fontWeight: 500, padding: '0.25rem 0.7rem', borderRadius: 20, border: '1px solid', borderColor: libraryCategory === null ? '#d6d1ce' : 'rgba(255,255,255,0.12)', background: libraryCategory === null ? '#d6d1ce' : 'none', color: libraryCategory === null ? '#0c0c0c' : '#6b6a6a', cursor: 'pointer', fontFamily: ui, transition: 'all .12s' }}
                  >
                    All
                  </button>
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setLibraryCategory(c)}
                      aria-pressed={libraryCategory === c}
                      style={{ fontSize: '0.72rem', fontWeight: 500, padding: '0.25rem 0.7rem', borderRadius: 20, border: '1px solid', borderColor: libraryCategory === c ? '#d6d1ce' : 'rgba(255,255,255,0.12)', background: libraryCategory === c ? '#d6d1ce' : 'none', color: libraryCategory === c ? '#0c0c0c' : '#6b6a6a', cursor: 'pointer', fontFamily: ui, transition: 'all .12s' }}
                    >
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
                <input
                  type="search"
                  placeholder="Search photos..."
                  value={librarySearch}
                  onChange={e => setLibrarySearch(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '0.35rem 0.7rem', color: '#d6d1ce', fontSize: '0.8rem', outline: 'none', fontFamily: ui, width: 200 }}
                  aria-label="Search photos"
                />
              </div>

              {/* Photo grid */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
                {libraryLoading && !libraryLoaded ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#4b4b4b', fontFamily: ui, fontSize: '0.85rem' }}>
                    Loading photos...
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#4b4b4b', fontFamily: ui, fontSize: '0.85rem' }}>
                    {libraryPhotos.length === 0 ? 'No photos in library yet.' : 'No photos match this filter.'}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
                    {filtered.map(photo => {
                      const isSelected = librarySelectedIds.has(photo.id)
                      const isAdded = currentIds.has(photo.id)
                      return (
                        <div
                          key={photo.id}
                          role="button"
                          tabIndex={isAdded ? -1 : 0}
                          aria-label={`${isAdded ? 'Already added: ' : isSelected ? 'Selected: ' : 'Select: '}${photo.filename ?? 'Photo'}`}
                          aria-pressed={isSelected}
                          onClick={() => { if (!isAdded) toggleLibrarySelect(photo.id) }}
                          onKeyDown={e => { if (!isAdded && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleLibrarySelect(photo.id) } }}
                          style={{
                            position: 'relative',
                            aspectRatio: '4/3',
                            overflow: 'hidden',
                            borderRadius: 4,
                            cursor: isAdded ? 'default' : 'pointer',
                            border: `2px solid ${isSelected ? '#1db954' : 'transparent'}`,
                            transition: 'border-color .1s',
                            background: '#1a1a1a',
                            opacity: isAdded ? 0.45 : 1,
                          }}
                        >
                          {photo.thumbUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photo.thumbUrl} alt={photo.alt ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3a', fontSize: '0.65rem', fontFamily: ui, padding: '0.25rem', textAlign: 'center' }}>{photo.filename ?? 'Photo'}</div>
                          )}
                          {isAdded && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#9b9a9a', letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.45rem', borderRadius: 3 }}>Added</span>
                            </div>
                          )}
                          {isSelected && !isAdded && (
                            <div style={{ position: 'absolute', top: '0.35rem', left: '0.35rem', width: 20, height: 20, borderRadius: '50%', background: '#1db954', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700, lineHeight: 1 }}>&#10003;</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                <span style={{ fontSize: '0.78rem', color: '#4b4b4b', fontFamily: ui }}>
                  {librarySelectedIds.size > 0 ? `${librarySelectedIds.size} selected` : 'Click photos to select'}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setShowLibraryModal(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#6b6a6a', borderRadius: 6, padding: '0.45rem 1rem', fontSize: '0.82rem', cursor: 'pointer', fontFamily: ui }}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addFromLibrary}
                    disabled={librarySelectedIds.size === 0}
                    style={{ background: '#1db954', border: 'none', color: '#fff', borderRadius: 6, padding: '0.45rem 1.2rem', fontSize: '0.82rem', fontWeight: 600, cursor: librarySelectedIds.size === 0 ? 'not-allowed' : 'pointer', fontFamily: ui, opacity: librarySelectedIds.size === 0 ? 0.4 : 1 }}
                  >
                    {librarySelectedIds.size > 0 ? `Add ${librarySelectedIds.size} photo${librarySelectedIds.size !== 1 ? 's' : ''}` : 'Add photos'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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
          {slug && (
            <a href={`/portfolio/${slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', fontWeight: 500, color: '#9b9a9a', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem 0.75rem', borderRadius: 6, whiteSpace: 'nowrap', fontFamily: ui }}>
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
              <div style={{ padding: '0.55rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3a3a3a', fontFamily: ui }}>{allGalleries.length} Galleries</span>
                <button
                  type="button"
                  onClick={() => { setNewTitle(''); setCreateError(''); setShowNewModal(true) }}
                  style={{ background: 'none', border: 'none', color: '#1db954', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: ui, display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.1rem 0.25rem' }}
                  aria-label="New gallery"
                >
                  + Add
                </button>
              </div>
              {allGalleries.length > 5 && (
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
                  <input
                    type="search"
                    placeholder="Search galleries..."
                    value={gallerySearch}
                    onChange={e => setGallerySearch(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '0.38rem 0.6rem', color: '#9b9a9a', fontSize: '0.75rem', outline: 'none', fontFamily: ui }}
                    aria-label="Search galleries"
                  />
                </div>
              )}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0' }}>
              {allGalleries.filter(g => !gallerySearch || g.title.toLowerCase().includes(gallerySearch.toLowerCase())).map(g => {
                const isCurrent = g.id === galleryId
                const position = allGalleries.indexOf(g) + 1
                return (
                  <Link
                    key={g.id}
                    href={`/gallery-editor/${g.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.45rem 0.75rem', textDecoration: 'none', background: isCurrent ? 'rgba(29,185,84,0.08)' : 'transparent', borderLeft: `2px solid ${isCurrent ? '#1db954' : 'transparent'}`, transition: 'background .1s' }}
                  >
                    {g.coverThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.coverThumb} alt="" style={{ width: 38, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 38, height: 28, borderRadius: 4, background: '#1e1e1e', flexShrink: 0, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.6rem', color: '#3a3a3a', fontFamily: ui }}>{position}</span>
                      </div>
                    )}
                    <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: isCurrent ? 600 : 400, color: isCurrent ? '#e6e1de' : '#9b9a9a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: ui, lineHeight: 1.3 }}>{isCurrent ? title : g.title}</div>
                      <div style={{ fontSize: '0.67rem', color: '#3a3a3a', display: 'flex', gap: '0.35rem', marginTop: '0.1rem', fontFamily: ui }}>
                        <span style={{ color: '#2e2e2e' }}>#{position}</span>
                        {g.status === 'draft' && <span style={{ color: '#5a5a5a' }}>Draft</span>}
                        {(() => { const count = isCurrent ? photos.length : (g.photoCount ?? 0); return count > 0 ? <span>{count} photo{count !== 1 ? 's' : ''}</span> : null })()}
                      </div>
                    </div>
                  </Link>
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
                  <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#6b6a6a', fontFamily: ui }}>URL slug</span>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
                    <span style={{ padding: '0.5rem 0 0.5rem 0.65rem', fontSize: '0.75rem', color: '#3a3a3a', fontFamily: ui, whiteSpace: 'nowrap', flexShrink: 0 }}>/portfolio/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={e => setField(setSlug)(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                      onBlur={e => setSlug(e.target.value.replace(/^-+|-+$/g, ''))}
                      style={{ flex: 1, background: 'transparent', border: 'none', padding: '0.5rem 0.65rem 0.5rem 0', color: '#e6e1de', fontSize: '0.82rem', outline: 'none', fontFamily: ui, minWidth: 0 }}
                      aria-label="URL slug"
                    />
                  </div>
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

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 500, color: '#6b6a6a', fontFamily: ui, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Cover photo</span>
                    {coverId && (
                      <button
                        type="button"
                        onClick={() => { setCoverId(null); setCoverThumb(null); markChanged() }}
                        style={{ background: 'none', border: 'none', color: '#5a5a5a', fontSize: '0.67rem', cursor: 'pointer', fontFamily: ui, padding: 0 }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {coverThumb ? (
                    <button
                      type="button"
                      onClick={() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      onMouseEnter={e => { const ov = (e.currentTarget as HTMLElement).querySelector('.cover-ov') as HTMLElement | null; if (ov) ov.style.opacity = '1' }}
                      onMouseLeave={e => { const ov = (e.currentTarget as HTMLElement).querySelector('.cover-ov') as HTMLElement | null; if (ov) ov.style.opacity = '0' }}
                      style={{ display: 'block', width: '100%', padding: 0, border: '1px solid rgba(201,162,39,0.35)', borderRadius: 6, overflow: 'hidden', cursor: 'pointer', background: 'none', position: 'relative' }}
                      aria-label="Change cover photo - scroll to photo grid"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverThumb} alt="Cover" style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', display: 'block' }} />
                      <div className="cover-ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .15s', pointerEvents: 'none' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff', fontFamily: ui }}>Change cover</span>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', aspectRatio: '16/10', background: '#1a1a1a', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 6, cursor: photos.length > 0 ? 'pointer' : 'default', color: '#3a3a3a', fontSize: '0.72rem', fontFamily: ui }}
                    >
                      {photos.length > 0 ? 'Hover a photo and click Set as cover' : 'Add photos first'}
                    </button>
                  )}
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }} />

                <button
                  type="button"
                  onClick={duplicateGallery}
                  disabled={duplicating}
                  aria-busy={duplicating}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#9b9a9a', borderRadius: 6, padding: '0.45rem 0.75rem', fontSize: '0.78rem', fontWeight: 500, cursor: duplicating ? 'wait' : 'pointer', fontFamily: ui, width: '100%', textAlign: 'left', opacity: duplicating ? 0.6 : 1 }}
                >
                  {duplicating ? 'Duplicating...' : 'Duplicate gallery'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{ background: 'none', border: '1px solid rgba(192,57,43,0.3)', color: '#c0392b', borderRadius: 6, padding: '0.45rem 0.75rem', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', fontFamily: ui, width: '100%', textAlign: 'left' }}
                >
                  Delete gallery
                </button>
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
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '0.8rem', fontFamily: ui }}>
                No cover photo set
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} aria-hidden="true" />
            <div style={{ position: 'absolute', bottom: '2rem', left: '2.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(230,225,222,0.65)', fontFamily: ui }}>{category}</p>
              <h1 style={{ margin: '0.25rem 0 0.4rem', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontFamily: font, color: '#e6e1de', fontWeight: 400, letterSpacing: '0.02em' }}>{title}</h1>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(230,225,222,0.55)', fontFamily: ui }}>{photos.length} photos</p>
            </div>
          </div>

          {/* Photo grid label */}
          <div style={{ padding: '1.25rem 2rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 500, color: '#4b4b4b', fontFamily: ui }}>
              {photos.length > 0
                ? selectMode
                  ? selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Click photos to select'
                  : `${photos.length} photo${photos.length !== 1 ? 's' : ''} - drag to reorder`
                : 'No photos yet'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {uploadProgress && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-end', minWidth: 120 }}>
                  <span style={{ fontSize: '0.7rem', color: '#6b6a6a', fontFamily: ui, whiteSpace: 'nowrap' }}>
                    {uploadProgress.done}/{uploadProgress.total} uploaded
                  </span>
                  <div style={{ width: 120, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#1db954', borderRadius: 2, width: `${Math.round((uploadProgress.done / uploadProgress.total) * 100)}%`, transition: 'width .3s ease' }} />
                  </div>
                </div>
              )}
              {photos.length > 0 && !selectMode && (
                <button
                  type="button"
                  onClick={() => { setSelectMode(true); setSelectedIds(new Set()) }}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#6b6a6a', borderRadius: 6, padding: '0.42rem 0.9rem', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: ui }}
                >
                  Select
                </button>
              )}
              {selectMode && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedIds.size === photos.length) {
                        setSelectedIds(new Set())
                      } else {
                        setSelectedIds(new Set(photos.map(p => p.id)))
                      }
                    }}
                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#9b9a9a', borderRadius: 6, padding: '0.42rem 0.9rem', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: ui }}
                  >
                    {selectedIds.size === photos.length ? 'Deselect all' : 'Select all'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }}
                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#6b6a6a', borderRadius: 6, padding: '0.42rem 0.9rem', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: ui }}
                  >
                    Cancel
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={removeSelected}
                      style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', color: '#e87070', borderRadius: 6, padding: '0.42rem 0.9rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: ui }}
                    >
                      Remove {selectedIds.size}
                    </button>
                  )}
                </>
              )}
              {!selectMode && (
                <>
                  <button
                    type="button"
                    onClick={() => void openLibrary()}
                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#9b9a9a', borderRadius: 6, padding: '0.42rem 0.9rem', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: ui }}
                  >
                    Add from library
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    aria-busy={uploading}
                    style={{ background: '#1db954', border: 'none', color: '#fff', borderRadius: 6, padding: '0.42rem 0.9rem', fontSize: '0.8rem', fontWeight: 600, cursor: uploading ? 'wait' : 'pointer', fontFamily: ui, opacity: uploading ? 0.6 : 1 }}
                  >
                    + Upload photos
                  </button>
                </>
              )}
            </div>
          </div>

          {uploadError && (
            <div role="alert" style={{ margin: '0 2rem 0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 6, fontSize: '0.78rem', color: '#f0a3a3', fontFamily: ui }}>{uploadError}</div>
          )}

          {/* The photo grid - this is the main editing surface */}
          <div ref={gridRef} style={{ padding: '0 2rem 4rem' }}>
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
                  ? 'repeat(auto-fill, minmax(240px, 1fr))'
                  : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: tapedStyle ? '2rem' : '0.5rem',
              }}>
                {photos.map((photo, i) => {
                  const isDragging = dragIdx === i
                  const isOver = overIdx === i && dragIdx !== null && dragIdx !== i
                  const isHovered = hoveredIdx === i
                  const isCover = photo.id === coverId

                  if (tapedStyle) {
                    const isSelected = selectedIds.has(photo.id)
                    return (
                      <div
                        key={photo.id}
                        draggable={!selectMode}
                        onClick={() => { if (selectMode) toggleSelect(photo.id) }}
                        onDragStart={e => { if (selectMode) { e.preventDefault(); return }; e.dataTransfer.effectAllowed = 'move'; setDragIdx(i) }}
                        onDragEnter={() => { if (!selectMode && dragIdx !== null && dragIdx !== i) setOverIdx(i) }}
                        onDragOver={e => { if (!selectMode) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' } }}
                        onDrop={e => { if (!selectMode) { e.preventDefault(); move(dragIdx!, i); setDragIdx(null); setOverIdx(null) } }}
                        onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        style={{
                          cursor: selectMode ? 'pointer' : isDragging ? 'grabbing' : 'grab',
                          opacity: isDragging ? 0.3 : 1,
                          transform: selectMode ? 'none' : `rotate(${(i % 5 - 2) * 1.2}deg) ${isOver ? 'scale(1.04)' : 'scale(1)'}`,
                          transition: 'opacity .12s, transform .15s',
                          position: 'relative',
                          outline: isSelected ? '3px solid #1db954' : 'none',
                          outlineOffset: 4,
                          borderRadius: 2,
                        }}
                      >
                        {/* Tape corners (hidden in select mode) */}
                        {!selectMode && [{ top: '-6px', left: '20%', rotate: '-35deg' }, { top: '-6px', right: '20%', rotate: '35deg' }, { bottom: '-6px', left: '20%', rotate: '35deg' }, { bottom: '-6px', right: '20%', rotate: '-35deg' }].map((pos, t) => (
                          <div key={t} aria-hidden="true" style={{ position: 'absolute', width: 36, height: 12, background: 'rgba(214,209,206,0.42)', transform: `rotate(${pos.rotate})`, zIndex: 2, ...Object.fromEntries(Object.entries(pos).filter(([k]) => k !== 'rotate')) }} />
                        ))}
                        <div style={{ background: 'var(--tape-mat, #f4efe8)', padding: '0.75rem 0.75rem 2.5rem', boxShadow: selectMode ? 'none' : 'var(--tape-shadow, 0 4px 16px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2))', position: 'relative' }}>
                          <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                            {photo.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={photo.url} alt={photo.alt ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: '#e8e3dc' }} />
                            )}
                            {/* Select mode overlay */}
                            {selectMode && (
                              <div style={{ position: 'absolute', inset: 0, background: isSelected ? 'rgba(29,185,84,0.2)' : 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: '0.4rem' }}>
                                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isSelected ? '#1db954' : 'rgba(255,255,255,0.7)'}`, background: isSelected ? '#1db954' : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {isSelected && <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700, lineHeight: 1 }}>&#10003;</span>}
                                </div>
                              </div>
                            )}
                            {/* Controls overlay (hidden in select mode) */}
                            {!selectMode && (isHovered || isCover) && (
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
                        {!selectMode && isOver && <div style={{ position: 'absolute', inset: -4, border: '2px dashed rgba(214,209,206,0.8)', borderRadius: 4, pointerEvents: 'none' }} aria-hidden="true" />}
                      </div>
                    )
                  }

                  const isSelected = selectedIds.has(photo.id)
                  return (
                    <div
                      key={photo.id}
                      draggable={!selectMode}
                      onClick={() => { if (selectMode) toggleSelect(photo.id) }}
                      onDragStart={e => { if (selectMode) { e.preventDefault(); return }; e.dataTransfer.effectAllowed = 'move'; setDragIdx(i) }}
                      onDragEnter={() => { if (!selectMode && dragIdx !== null && dragIdx !== i) setOverIdx(i) }}
                      onDragOver={e => { if (!selectMode) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' } }}
                      onDrop={e => { if (!selectMode) { e.preventDefault(); move(dragIdx!, i); setDragIdx(null); setOverIdx(null) } }}
                      onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      style={{
                        position: 'relative',
                        aspectRatio: '4/3',
                        overflow: 'hidden',
                        cursor: selectMode ? 'pointer' : isDragging ? 'grabbing' : 'grab',
                        opacity: isDragging ? 0.3 : 1,
                        border: `2px solid ${isSelected ? '#1db954' : isOver ? 'rgba(214,209,206,0.9)' : isCover ? 'rgba(201,162,39,0.5)' : 'transparent'}`,
                        transition: 'opacity .12s, border-color .1s, transform .1s',
                        transform: isOver ? 'scale(1.02)' : 'scale(1)',
                        background: '#1a1a1a',
                      }}
                    >
                      {photo.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo.url} alt={photo.alt ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '0.75rem', fontFamily: ui }}>{photo.filename ?? 'Photo'}</div>
                      )}

                      {/* Dark overlay on hover */}
                      <div style={{ position: 'absolute', inset: 0, background: (isHovered || selectMode) ? (isSelected ? 'rgba(29,185,84,0.15)' : 'rgba(0,0,0,0.45)') : 'rgba(0,0,0,0.1)', transition: 'background .15s', pointerEvents: 'none' }} aria-hidden="true" />

                      {/* Select mode checkmark */}
                      {selectMode && (
                        <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isSelected ? '#1db954' : 'rgba(255,255,255,0.5)'}`, background: isSelected ? '#1db954' : 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s' }}>
                          {isSelected && <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700, lineHeight: 1 }}>&#10003;</span>}
                        </div>
                      )}

                      {/* Position number (hidden in select mode) */}
                      {!selectMode && <span style={{ position: 'absolute', top: '0.4rem', left: '0.4rem', fontSize: '0.6rem', fontWeight: 700, background: 'rgba(0,0,0,0.65)', color: '#d6d1ce', padding: '0.15rem 0.35rem', borderRadius: 3 }}>{i + 1}</span>}

                      {/* Remove button (hidden in select mode) */}
                      {!selectMode && (
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          aria-label={`Remove photo ${i + 1}`}
                          style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isHovered ? 1 : 0, transition: 'opacity .15s' }}
                        >
                          &times;
                        </button>
                      )}

                      {/* Cover / set cover (hidden in select mode) */}
                      {!selectMode && (
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
                      )}

                      {/* Drag grip dots (hidden in select mode) */}
                      {!selectMode && (
                        <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', display: 'grid', gridTemplateColumns: 'repeat(3,4px)', gap: '3px', opacity: isHovered && !isDragging ? 0.7 : 0, transition: 'opacity .15s', pointerEvents: 'none' }}>
                          {Array.from({ length: 9 }).map((_, d) => (
                            <div key={d} style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff' }} />
                          ))}
                        </div>
                      )}
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
        <span style={{ fontSize: '0.78rem', fontWeight: 500, color: saving ? '#6b6a6a' : hasChanges ? '#d4a44c' : '#3a3a3a', fontFamily: ui, transition: 'color .2s' }}>
          {saving ? 'Saving...' : hasChanges ? 'Unsaved changes' : 'All changes saved'}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.67rem', color: '#3a3a3a', fontFamily: ui }}>&#8984;S</span>
          <button
            type="button"
            onClick={() => void save(isDraft ? 'draft' : undefined)}
            disabled={saving}
            aria-busy={saving}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#9b9a9a', borderRadius: 6, padding: '0.5rem 1.2rem', fontSize: '0.82rem', fontWeight: 500, cursor: saving ? 'wait' : 'pointer', fontFamily: ui, opacity: saving ? 0.5 : 1 }}
          >
            {isDraft ? 'Save draft' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => void save('published')}
            disabled={saving}
            aria-busy={saving}
            style={{ background: '#1db954', border: 'none', color: '#fff', borderRadius: 6, padding: '0.5rem 1.4rem', fontSize: '0.82rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: ui, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : isDraft ? 'Publish' : 'Save & publish'}
          </button>
        </div>
      </footer>
    </div>
  )
}
