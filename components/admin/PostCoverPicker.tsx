'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useField } from '@payloadcms/ui'

type PhotoDoc = {
  id: number
  url?: string | null
  filename?: string | null
  alt?: string | null
  category?: string | null
  sizes?: {
    card?: { url?: string | null } | null
    thumbnail?: { url?: string | null } | null
  } | null
}

const CAT_LABELS: Record<string, string> = {
  weddings: 'Weddings',
  portraits: 'Portraits',
  families: 'Families',
  couples: 'Couples',
  brands: 'Brands',
}

function thumbUrl(p: PhotoDoc): string | null {
  return p.sizes?.thumbnail?.url ?? p.sizes?.card?.url ?? p.url ?? null
}

export function PostCoverPicker() {
  const { value, setValue } = useField<number | null>({ path: 'coverImage' })

  const [current, setCurrent] = useState<PhotoDoc | null>(null)
  const [open, setOpen] = useState(false)
  const [photos, setPhotos] = useState<PhotoDoc[]>([])
  const [filter, setFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const didFetch = useRef(false)

  // Load current photo when value changes
  useEffect(() => {
    if (!value) { setCurrent(null); return }
    fetch(`/api/photos/${value}?depth=0`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setCurrent(d) })
      .catch(() => {})
  }, [value])

  const openModal = useCallback(() => {
    setOpen(true)
    if (didFetch.current) return
    didFetch.current = true
    setLoading(true)
    fetch('/api/photos?limit=300&depth=0', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { docs: [] })
      .then(d => setPhotos(d.docs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pick = useCallback((p: PhotoDoc) => {
    setValue(p.id)
    setCurrent(p)
    setOpen(false)
  }, [setValue])

  const clear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setValue(null)
    setCurrent(null)
  }, [setValue])

  const categories = [...new Set(photos.map(p => p.category).filter(Boolean))] as string[]
  const visible = filter ? photos.filter(p => p.category === filter) : photos

  const currentThumb = current
    ? (current.sizes?.card?.url ?? current.sizes?.thumbnail?.url ?? current.url ?? null)
    : null

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{
        display: 'block',
        fontSize: '0.72rem',
        fontFamily: "'Roboto Mono', monospace",
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#9B9A9A',
        marginBottom: '0.6rem',
      }}>
        Cover Photo
      </label>

      {/* Preview or placeholder */}
      <div
        onClick={openModal}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          cursor: 'pointer',
          padding: '0.6rem',
          border: '1px solid rgba(155,154,154,0.2)',
          borderRadius: '4px',
          background: 'rgba(19,19,19,0.6)',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(155,154,154,0.45)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(155,154,154,0.2)')}
      >
        {currentThumb ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentThumb}
              alt={current?.alt ?? 'Cover photo'}
              style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#D6D1CE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {current?.filename ?? 'Cover photo'}
              </p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.68rem', color: '#9B9A9A', fontFamily: "'Roboto Mono', monospace" }}>
                Change Cover Photo
              </p>
            </div>
            <button
              onClick={clear}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9B9A9A', fontSize: '1rem', padding: '0.25rem',
                lineHeight: 1, flexShrink: 0,
              }}
              aria-label="Remove cover photo"
            >
              ×
            </button>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b6a6a', fontFamily: "'Roboto Mono', monospace", padding: '0.2rem 0' }}>
            Choose Cover Photo from library...
          </p>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: '#161616', borderRadius: '6px', overflow: 'hidden',
              width: '100%', maxWidth: 900, maxHeight: '85vh',
              display: 'flex', flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(155,154,154,0.15)',
            }}>
              <h2 style={{ margin: 0, fontSize: '0.85rem', fontFamily: "'Roboto Mono', monospace", color: '#D6D1CE', letterSpacing: '0.06em' }}>
                Choose Cover Photo
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9B9A9A', fontSize: '1.2rem', lineHeight: 1, padding: '0.25rem',
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Category filter */}
            <div style={{
              display: 'flex', gap: '0.5rem', padding: '0.75rem 1.25rem',
              borderBottom: '1px solid rgba(155,154,154,0.1)',
              flexWrap: 'wrap',
            }}>
              {['all', ...categories].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat === 'all' ? null : cat)}
                  style={{
                    fontSize: '0.65rem', fontFamily: "'Roboto Mono', monospace",
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '0.3rem 0.7rem', borderRadius: '999px', border: '1px solid',
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: (filter === null && cat === 'all') || filter === cat ? 'rgba(155,154,154,0.2)' : 'transparent',
                    borderColor: (filter === null && cat === 'all') || filter === cat ? 'rgba(155,154,154,0.5)' : 'rgba(155,154,154,0.2)',
                    color: (filter === null && cat === 'all') || filter === cat ? '#D6D1CE' : '#9B9A9A',
                  }}
                >
                  {cat === 'all' ? 'All' : (CAT_LABELS[cat] ?? cat)}
                </button>
              ))}
            </div>

            {/* Photo grid */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '0.75rem 1.25rem' }}>
              {loading ? (
                <p style={{ color: '#9B9A9A', fontFamily: "'Roboto Mono', monospace", fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' }}>
                  Loading photos...
                </p>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '4px',
                }}>
                  {visible.map(p => {
                    const url = thumbUrl(p)
                    const isSelected = value === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => pick(p)}
                        style={{
                          position: 'relative', padding: 0, border: 'none',
                          cursor: 'pointer', background: '#0C0C0C',
                          outline: isSelected ? '2px solid #D6D1CE' : 'none',
                          outlineOffset: '0',
                          borderRadius: '2px', overflow: 'hidden',
                          aspectRatio: '3/2',
                        }}
                        aria-label={`Select photo: ${p.filename ?? p.alt ?? String(p.id)}`}
                        aria-pressed={isSelected}
                      >
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt={p.alt ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#1a1a1a' }} />
                        )}
                        {isSelected && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(214,209,206,0.18)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: '1.3rem', color: '#fff' }}>✓</span>
                          </div>
                        )}
                      </button>
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
