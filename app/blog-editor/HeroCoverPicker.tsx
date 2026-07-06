'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { isUnsupportedImage, uploadPhotoToLibrary, type IngestedPhoto } from '@/app/lib/uploadPhoto'

// Same photo-picker modal pattern as app/builder/ImagePickerField.tsx (choose
// from library or upload new), but the hero image itself is the click target
// instead of a small thumbnail+button row - matches the reference's "click
// hero to change cover image" interaction. Reports back a photo id (Posts.
// coverImage is a relationship, not a raw URL like Puck's image fields).

type PhotoDoc = IngestedPhoto

const CATEGORIES = ['all', 'weddings', 'portraits', 'families', 'couples', 'brands']
const CAT_LABELS: Record<string, string> = {
  all: 'All', weddings: 'Weddings', portraits: 'Portraits', families: 'Families', couples: 'Couples', brands: 'Brands',
}

const thumbOf = (p: PhotoDoc) => p.sizes?.thumbnail?.url ?? p.url ?? ''

export function HeroCoverPicker({
  onSelect,
  children,
}: {
  onSelect: (photoId: number) => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [photos, setPhotos] = useState<PhotoDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [cat, setCat] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const openModal = useCallback(() => {
    setOpen(true)
    setCat('all')
    setUploadError('')
    setLoading(true)
    fetch('/api/photos?limit=500&depth=0', { credentials: 'include' })
      .then(r => r.json())
      .then((data: { docs?: PhotoDoc[] }) => { setPhotos(data.docs ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleUpload = async (file: File) => {
    setUploadError('')
    if (isUnsupportedImage(file)) {
      const ext = (file.name.split('.').pop() ?? '').toUpperCase()
      setUploadError(`${ext} files are not supported. Export the photo as JPEG and upload that.`)
      return
    }
    setUploading(true)
    try {
      const doc = await uploadPhotoToLibrary(file)
      setPhotos(prev => [doc as PhotoDoc, ...prev])
      onSelect((doc as PhotoDoc).id)
      setOpen(false)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const filtered = cat === 'all' ? photos : photos.filter(p => p.category === cat)

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="Change cover image"
        style={{ position: 'relative', display: 'block', width: '100%', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
        className="hero-cover-trigger"
      >
        {children}
        <span
          className="hero-cover-hint"
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(12,12,12,0.45)', opacity: 0, transition: 'opacity 0.15s',
            color: '#fff', fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem', letterSpacing: '0.04em',
            pointerEvents: 'none', zIndex: 5,
          }}
        >
          Click to change cover image
        </span>
      </button>
      <style>{`.hero-cover-trigger:hover .hero-cover-hint { opacity: 1 !important; }`}</style>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="hero-picker-heading"
            onClick={e => e.stopPropagation()}
            style={{ background: '#1a1a1a', border: '1px solid rgba(155,154,154,0.18)', borderRadius: 6, width: 'min(92vw, 1000px)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.2rem', borderBottom: '1px solid rgba(155,154,154,0.12)' }}>
              <span id="hero-picker-heading" style={{ color: '#d6d1ce', fontWeight: 600 }}>Choose a Cover Photo</span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) void handleUpload(f)
                    e.target.value = ''
                  }}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} aria-busy={uploading} style={{ ...btn, background: '#9b9a9a', color: '#0c0c0c', opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? 'Uploading...' : '+ Upload Photo'}
                </button>
                <button type="button" onClick={() => setOpen(false)} style={{ ...btn, background: 'transparent' }}>Cancel</button>
              </div>
            </div>

            {uploadError && (
              <div role="alert" style={{ padding: '0.6rem 1.2rem', color: '#f87171', fontSize: '0.78rem', borderBottom: '1px solid rgba(155,154,154,0.08)' }}>
                {uploadError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', padding: '0.55rem 1.2rem', borderBottom: '1px solid rgba(155,154,154,0.08)' }}>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  aria-pressed={cat === c}
                  style={{ padding: '0.2rem 0.6rem', borderRadius: 3, fontSize: '0.72rem', cursor: 'pointer', textTransform: 'capitalize', background: cat === c ? 'rgba(155,154,154,0.2)' : 'transparent', border: `1px solid ${cat === c ? 'rgba(155,154,154,0.4)' : 'rgba(155,154,154,0.15)'}`, color: cat === c ? '#d6d1ce' : '#9b9a9a' }}
                >
                  {CAT_LABELS[c]}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 1.2rem' }}>
              {loading ? (
                <p style={{ textAlign: 'center', color: '#9b9a9a', padding: '2.5rem' }}>Loading photos...</p>
              ) : filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9b9a9a', padding: '2.5rem' }}>No photos here yet. Use Upload Photo to add one.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                  {filtered.map(p => (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      aria-label={p.alt ?? p.filename ?? 'Photo'}
                      onClick={() => { onSelect(p.id); setOpen(false) }}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(p.id); setOpen(false) } }}
                      style={{ position: 'relative', aspectRatio: '1', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', border: '2px solid transparent' }}
                    >
                      {thumbOf(p) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbOf(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#2a2a2a' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const btn: React.CSSProperties = {
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.75rem',
  borderRadius: 4,
  border: '1px solid rgba(155,154,154,0.3)',
  background: 'rgba(155,154,154,0.12)',
  color: '#e6e1de',
  padding: '0.4rem 0.75rem',
}
