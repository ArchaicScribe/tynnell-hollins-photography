'use client'

import { useEffect, useRef, useState } from 'react'
import { isUnsupportedImage, uploadPhotoToLibrary, type IngestedPhoto } from '@/app/lib/uploadPhoto'

// TYN-341: Tynnell wants a photo to land exactly where she drops it, not
// snapped into a preset grid cell. Editing happens here, in the Fields
// sidebar, not by dragging the block's own rendered output - Puck's `render`
// is shared by the editor canvas AND the public site, so it can't safely
// depend on usePuck()/dispatch the way componentOverlay does. This matches
// every other interactive Puck field in this file (ImagePickerField,
// LayoutVariantField): drag/resize here, watch the live canvas above update
// instantly via onChange.
//
// Position/size are stored as percentages of the canvas, not pixels, so a
// layout holds up across breakpoints without a separate mobile pass.

export type FreeformPhoto = {
  id: string
  url: string
  x: number // percent, left edge
  y: number // percent, top edge
  width: number // percent of canvas width
  height: number // percent of canvas height
  rotate: number // degrees - a slight tilt reads as hand-placed, not mechanical
  // Full image-control parity with the Background Image treatment (TYN-351) -
  // all optional so existing placed photos keep working with sensible
  // defaults (centered focal point, full opacity, no overlay, no link).
  alt?: string
  focalX?: number // percent, 0-100
  focalY?: number // percent, 0-100
  imageOpacity?: number // 0-100
  overlayOpacity?: number // 0-100
  overlayColor?: string
  anchorHref?: string
}

type PhotoDoc = IngestedPhoto

const CATEGORIES = ['all', 'weddings', 'portraits', 'families', 'couples', 'brands']
const CAT_LABELS: Record<string, string> = {
  all: 'All', weddings: 'Weddings', portraits: 'Portraits', families: 'Families', couples: 'Couples', brands: 'Brands',
}
const thumbOf = (p: PhotoDoc) => p.sizes?.thumbnail?.url ?? p.url ?? ''
const valueOf = (p: PhotoDoc) => p.sizes?.card?.url ?? p.url ?? ''

const MIN_SIZE = 8 // percent - keeps a drag/resize from collapsing a tile to nothing

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), Math.max(min, max))
}

export function FreeformPhotoCanvasField({ value, onChange }: { value?: FreeformPhoto[]; onChange: (v: FreeformPhoto[]) => void }) {
  const photos = value ?? []
  const canvasRef = useRef<HTMLDivElement>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [replacingId, setReplacingId] = useState<string | null>(null)

  const update = (id: string, patch: Partial<FreeformPhoto>) => {
    onChange(photos.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }
  const remove = (id: string) => onChange(photos.filter((p) => p.id !== id))

  const addPhoto = (url: string) => {
    const offset = (photos.length % 4) * 6
    const next: FreeformPhoto = { id: crypto.randomUUID(), url, x: 8 + offset, y: 8 + offset, width: 32, height: 40, rotate: 0 }
    onChange([...photos, next])
    setPickerOpen(false)
  }

  const settingsPhoto = photos.find((p) => p.id === settingsId) ?? null

  const startDrag = (e: React.MouseEvent, photo: FreeformPhoto, mode: 'move' | 'resize') => {
    e.preventDefault()
    e.stopPropagation()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const orig = { x: photo.x, y: photo.y, width: photo.width, height: photo.height }

    const onMove = (ev: MouseEvent) => {
      const dxPct = ((ev.clientX - startX) / rect.width) * 100
      const dyPct = ((ev.clientY - startY) / rect.height) * 100
      if (mode === 'move') {
        update(photo.id, {
          x: clamp(orig.x + dxPct, 0, 100 - orig.width),
          y: clamp(orig.y + dyPct, 0, 100 - orig.height),
        })
      } else {
        update(photo.id, {
          width: clamp(orig.width + dxPct, MIN_SIZE, 100 - orig.x),
          height: clamp(orig.height + dyPct, MIN_SIZE, 100 - orig.y),
        })
      }
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div style={{ fontFamily: 'inherit' }}>
      <div
        ref={canvasRef}
        style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#1c1c1c', border: '1px dashed rgba(155,154,154,0.35)', borderRadius: 4, overflow: 'hidden' }}
      >
        {photos.length === 0 && (
          <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6a6a', fontSize: '0.78rem', textAlign: 'center', padding: '0 1rem', margin: 0 }}>
            Add photos, then drag to place and drag the corner to resize.
          </p>
        )}
        {photos.map((p) => (
          <div
            key={p.id}
            onMouseDown={(e) => startDrag(e, p, 'move')}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.width}%`,
              height: `${p.height}%`,
              cursor: 'move',
              border: '1px solid rgba(214,209,206,0.6)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.alt ?? ''}
              style={{
                width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', display: 'block',
                objectPosition: `${p.focalX ?? 50}% ${p.focalY ?? 50}%`,
                opacity: (p.imageOpacity ?? 100) / 100,
              }}
            />
            {(p.overlayOpacity ?? 0) > 0 && (
              <div style={{ position: 'absolute', inset: 0, background: p.overlayColor ?? '#000000', opacity: (p.overlayOpacity ?? 0) / 100, pointerEvents: 'none' }} />
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSettingsId(p.id) }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Photo settings"
              title="Change Image, Alt Text, Focal Point, Opacity, Overlay, Link"
              style={{ position: 'absolute', top: -8, left: -8, width: 20, height: 20, borderRadius: '50%', background: '#1a1a1a', color: '#e6e1de', border: '1px solid rgba(155,154,154,0.4)', fontSize: '0.7rem', lineHeight: '18px', cursor: 'pointer', padding: 0 }}
            >
              &#9881;
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(p.id) }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Remove photo"
              style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', background: '#1a1a1a', color: '#e6e1de', border: '1px solid rgba(155,154,154,0.4)', fontSize: '0.7rem', lineHeight: '18px', cursor: 'pointer', padding: 0 }}
            >
              &times;
            </button>
            <div
              onMouseDown={(e) => startDrag(e, p, 'resize')}
              title="Drag to resize"
              style={{ position: 'absolute', bottom: -6, right: -6, width: 14, height: 14, borderRadius: '50%', background: '#d6d1ce', border: '2px solid #1a1a1a', cursor: 'nwse-resize' }}
            />
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setPickerOpen(true)} style={{ marginTop: '0.6rem', ...btn }}>
        + Add Photo
      </button>

      {pickerOpen && <PhotoPickerModal onPick={addPhoto} onClose={() => setPickerOpen(false)} />}

      {settingsPhoto && (
        <PhotoSettingsModal
          photo={settingsPhoto}
          onChange={(patch) => update(settingsPhoto.id, patch)}
          onReplace={() => { setReplacingId(settingsPhoto.id); setSettingsId(null) }}
          onClose={() => setSettingsId(null)}
        />
      )}

      {replacingId && (
        <PhotoPickerModal
          onPick={(url) => { update(replacingId, { url }); setReplacingId(null) }}
          onClose={() => setReplacingId(null)}
        />
      )}
    </div>
  )
}

// Full image-control parity with the Background Image treatment (TYN-351):
// Change Image, Alt Text, Set Focal (click the preview to set focal point),
// Image Opacity, Overlay Opacity + Color, and an Anchor Link.
function PhotoSettingsModal({ photo, onChange, onReplace, onClose }: {
  photo: FreeformPhoto
  onChange: (patch: Partial<FreeformPhoto>) => void
  onReplace: () => void
  onClose: () => void
}) {
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const setFocalFromClick = (e: React.MouseEvent) => {
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100)
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100)
    onChange({ focalX: Math.round(x), focalY: Math.round(y) })
  }

  const focalX = photo.focalX ?? 50
  const focalY = photo.focalY ?? 50

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-settings-heading"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#1a1a1a', border: '1px solid rgba(155,154,154,0.18)', borderRadius: 6, width: 'min(92vw, 420px)', maxHeight: '88vh', overflowY: 'auto', padding: '1rem 1.2rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <span id="photo-settings-heading" style={{ color: '#d6d1ce', fontWeight: 600, fontSize: '0.9rem' }}>Photo Settings</span>
          <button type="button" onClick={onClose} style={{ ...btn, background: 'transparent' }}>Done</button>
        </div>

        <button type="button" onClick={onReplace} style={{ ...btn, width: '100%', marginBottom: '0.9rem' }}>Change Image</button>

        <label style={fieldLabel}>Set Focal (click the photo)</label>
        <div
          ref={previewRef}
          onClick={setFocalFromClick}
          style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', borderRadius: 4, overflow: 'hidden', cursor: 'crosshair', marginBottom: '0.9rem' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
          <div
            style={{
              position: 'absolute', left: `${focalX}%`, top: `${focalY}%`, transform: 'translate(-50%, -50%)',
              width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.6)', pointerEvents: 'none',
            }}
          />
        </div>

        <label style={fieldLabel}>Alt Text</label>
        <input
          type="text"
          value={photo.alt ?? ''}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="Describe this photo"
          style={inputStyle}
        />

        <label style={fieldLabel}>Image Opacity ({photo.imageOpacity ?? 100}%)</label>
        <input
          type="range" min={0} max={100} value={photo.imageOpacity ?? 100}
          onChange={(e) => onChange({ imageOpacity: Number(e.target.value) })}
          style={{ width: '100%', marginBottom: '0.9rem' }}
        />

        <label style={fieldLabel}>Overlay Opacity ({photo.overlayOpacity ?? 0}%)</label>
        <input
          type="range" min={0} max={100} value={photo.overlayOpacity ?? 0}
          onChange={(e) => onChange({ overlayOpacity: Number(e.target.value) })}
          style={{ width: '100%', marginBottom: '0.4rem' }}
        />

        <label style={fieldLabel}>Overlay Color</label>
        <input
          type="color"
          value={photo.overlayColor ?? '#000000'}
          onChange={(e) => onChange({ overlayColor: e.target.value })}
          style={{ width: '100%', height: 32, marginBottom: '0.9rem', cursor: 'pointer', border: '1px solid rgba(155,154,154,0.3)', borderRadius: 4, background: 'transparent' }}
        />

        <label style={fieldLabel}>Anchor Link (optional)</label>
        <input
          type="text"
          value={photo.anchorHref ?? ''}
          onChange={(e) => onChange({ anchorHref: e.target.value })}
          placeholder="/portfolio or https://..."
          style={inputStyle}
        />
      </div>
    </div>
  )
}

// Same fetch/category-filter/upload modal ImagePickerField.tsx uses, but calls
// back per-selection instead of holding a single value - this field manages
// its own array of placed photos rather than one value.
function PhotoPickerModal({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [photos, setPhotos] = useState<PhotoDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    fetch('/api/photos?limit=500&depth=0', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { docs?: PhotoDoc[] }) => { setPhotos(data.docs ?? []); setLoading(false) })
      .catch(() => setLoading(false))
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

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
      onPick(valueOf(doc))
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const filtered = cat === 'all' ? photos : photos.filter((p) => p.category === cat)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="freeform-picker-heading"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#1a1a1a', border: '1px solid rgba(155,154,154,0.18)', borderRadius: 6, width: 'min(92vw, 1000px)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.2rem', borderBottom: '1px solid rgba(155,154,154,0.12)' }}>
          <span id="freeform-picker-heading" style={{ color: '#d6d1ce', fontWeight: 600 }}>Add a Photo</span>
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
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} aria-busy={uploading} style={{ ...btn, background: '#9b9a9a', color: '#0c0c0c', opacity: uploading ? 0.6 : 1 }}>
              {uploading ? 'Uploading...' : '+ Upload Photo'}
            </button>
            <button type="button" onClick={onClose} style={{ ...btn, background: 'transparent' }}>Cancel</button>
          </div>
        </div>

        {uploadError && (
          <div role="alert" style={{ padding: '0.6rem 1.2rem', color: '#f87171', fontSize: '0.78rem', borderBottom: '1px solid rgba(155,154,154,0.08)' }}>
            {uploadError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', padding: '0.55rem 1.2rem', borderBottom: '1px solid rgba(155,154,154,0.08)' }}>
          {CATEGORIES.map((c) => (
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
              {filtered.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  aria-label={p.alt ?? p.filename ?? 'Photo'}
                  onClick={() => onPick(valueOf(p))}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(valueOf(p)) } }}
                  style={{ position: 'relative', aspectRatio: '1', borderRadius: 4, overflow: 'hidden', cursor: 'pointer' }}
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

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  color: '#9b9a9a',
  marginBottom: '0.3rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'inherit',
  fontSize: '0.8rem',
  padding: '0.4rem 0.6rem',
  borderRadius: 4,
  border: '1px solid rgba(155,154,154,0.3)',
  background: '#111',
  color: '#e6e1de',
  marginBottom: '0.9rem',
  boxSizing: 'border-box',
}
