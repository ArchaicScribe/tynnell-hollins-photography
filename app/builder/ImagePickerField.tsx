'use client'

import { useCallback, useRef, useState } from 'react'
import { isUnsupportedImage, uploadPhotoToLibrary, type IngestedPhoto } from '@/app/lib/uploadPhoto'

// Puck custom-field UI: pick an image from the photo library, OR upload a new
// one right here (TYN-220 + TYN-222). Stores the selected photo's R2 URL.
// Manual-URL input kept as a fallback for external images.

type PhotoDoc = IngestedPhoto

const CATEGORIES = ['all', 'weddings', 'portraits', 'families', 'couples', 'brands']
const CAT_LABELS: Record<string, string> = {
  all: 'All', weddings: 'Weddings', portraits: 'Portraits', families: 'Families', couples: 'Couples', brands: 'Brands',
}

const thumbOf = (p: PhotoDoc) => p.sizes?.thumbnail?.url ?? p.url ?? ''
const valueOf = (p: PhotoDoc) => p.sizes?.card?.url ?? p.url ?? ''

export function ImagePickerField({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [photos, setPhotos] = useState<PhotoDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [cat, setCat] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openModal = useCallback(() => {
    setOpen(true)
    setCat('all')
    setUploadError('')
    setLoading(true)
    fetch('/api/photos?limit=500&depth=0', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { docs?: PhotoDoc[] }) => {
        setPhotos(data.docs ?? [])
        setLoading(false)
      })
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
      setPhotos((prev) => [doc, ...prev])
      onChange(valueOf(doc))
      setOpen(false)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const filtered = cat === 'all' ? photos : photos.filter((p) => p.category === cat)

  return (
    <div style={{ fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ width: 64, height: 48, flexShrink: 0, borderRadius: 4, overflow: 'hidden', background: '#232323', border: '1px solid rgba(155,154,154,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#6b6a6a', fontSize: '1.1rem' }}>&#128247;</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button type="button" onClick={openModal} style={btn}>
            {value ? 'Change Image' : 'Choose Image'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} style={{ ...btn, background: 'transparent' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="or paste an image URL"
        style={{ marginTop: '0.5rem', width: '100%', boxSizing: 'border-box', background: '#232323', color: '#e6e1de', border: '1px solid rgba(155,154,154,0.25)', borderRadius: 4, padding: '0.4rem 0.55rem', fontSize: '0.8rem' }}
      />

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#1a1a1a', border: '1px solid rgba(155,154,154,0.18)', borderRadius: 6, width: 'min(92vw, 1000px)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.2rem', borderBottom: '1px solid rgba(155,154,154,0.12)' }}>
              <span style={{ color: '#d6d1ce', fontWeight: 600 }}>Choose a Photo</span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUpload(f)
                    e.target.value = ''
                  }}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ ...btn, background: '#9b9a9a', color: '#0c0c0c', opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? 'Uploading...' : '+ Upload Photo'}
                </button>
                <button type="button" onClick={() => setOpen(false)} style={{ ...btn, background: 'transparent' }}>Cancel</button>
              </div>
            </div>

            {uploadError && (
              <div style={{ padding: '0.6rem 1.2rem', color: '#f87171', fontSize: '0.78rem', borderBottom: '1px solid rgba(155,154,154,0.08)' }}>
                {uploadError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', padding: '0.55rem 1.2rem', borderBottom: '1px solid rgba(155,154,154,0.08)' }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
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
                  {filtered.map((p) => {
                    const v = valueOf(p)
                    const isSelected = v === value
                    return (
                      <div
                        key={p.id}
                        onClick={() => { onChange(v); setOpen(false) }}
                        style={{ position: 'relative', aspectRatio: '1', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${isSelected ? 'rgba(214,209,206,0.8)' : 'transparent'}` }}
                      >
                        {thumbOf(p) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumbOf(p)} alt={p.alt ?? ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#2a2a2a' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
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
