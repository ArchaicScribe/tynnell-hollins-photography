'use client'
import React, { useEffect, useState } from 'react'
import { useDocumentInfo, useField, useFormFields } from '@payloadcms/ui'

type PhotoValue =
  | number
  | { id?: number; url?: string | null; thumbnailURL?: string | null; sizes?: { thumbnail?: { url?: string | null } } | null }
  | null
  | undefined
type PhotoDoc = { url?: string | null; sizes?: { thumbnail?: { url?: string | null } } | null }

function getPhotoId(v: PhotoValue): number | null {
  if (typeof v === 'number') return v
  if (v && typeof v === 'object') return v.id ?? null
  return null
}

function thumbFromValue(v: PhotoValue): string | null {
  if (v && typeof v === 'object') return v.sizes?.thumbnail?.url ?? v.thumbnailURL ?? v.url ?? null
  return null
}

export function TestimonialsEditHeader() {
  const { id } = useDocumentInfo()
  const clientName = useFormFields(([fields]) => fields.clientName?.value as string | undefined)
  const quote = useFormFields(([fields]) => fields.quote?.value as string | undefined)
  const sessionType = useFormFields(([fields]) => fields.sessionType?.value as string | undefined)
  const displayOrder = useFormFields(([fields]) => fields.displayOrder?.value as number | undefined)
  const { value: rawPhoto } = useField<PhotoValue>({ path: 'photo' })
  const { value: featured, setValue: setFeatured } = useField<boolean>({ path: 'featured' })

  const photoId = getPhotoId(rawPhoto)
  const inlineThumb = thumbFromValue(rawPhoto)

  const [fetchedDoc, setFetchedDoc] = useState<PhotoDoc | null>(null)
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setFetchedDoc(null)
    setImgFailed(false)
    if (inlineThumb || !photoId) return
    let active = true
    const timer = setTimeout(() => {
      if (!active) return
      fetch(`/api/photos/${photoId}?depth=0`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (active && data) setFetchedDoc(data)
        })
        .catch(() => {})
    }, 150)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [photoId, inlineThumb])

  if (!id) return null

  const previewUrl = inlineThumb ?? fetchedDoc?.sizes?.thumbnail?.url ?? fetchedDoc?.url ?? null

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.5rem',
        background: '#161616',
        border: '1px solid rgba(155,154,154,0.18)',
        borderRadius: 8,
        padding: '1.25rem',
        marginBottom: '1.75rem',
      }}
    >
      {/* Preview */}
      <div
        style={{
          flex: '0 0 auto',
          width: 280,
          maxWidth: '100%',
          height: 210,
          background: '#0c0c0c',
          border: '1px solid rgba(155,154,154,0.18)',
          borderRadius: 6,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {previewUrl && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={clientName ?? 'Testimonial feature photo'}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: '#6b6a6a', fontSize: '0.78rem', textAlign: 'center', padding: '0 1rem', lineHeight: 1.5 }}>
            {photoId ? 'Loading photo...' : 'No feature photo'}
          </span>
        )}
      </div>

      {/* Meta + actions */}
      <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div>
          <div style={{ color: '#D6D1CE', fontSize: '1.1rem', fontWeight: 500, fontFamily: "'Archivo', sans-serif", letterSpacing: '-0.01em' }}>
            {clientName || 'Unnamed Client'}
          </div>
          {quote && (
            <div
              style={{
                color: '#9B9A9A',
                fontSize: '0.82rem',
                fontStyle: 'italic',
                lineHeight: 1.5,
                marginTop: '0.4rem',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              &ldquo;{quote}&rdquo;
            </div>
          )}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          {sessionType && (
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 4,
                border: '1px solid rgba(155,154,154,0.3)',
                color: '#c8c3c0',
              }}
            >
              {sessionType}
            </span>
          )}

          {displayOrder != null && (
            <span style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: 4, color: '#6b6a6a' }}>
              #{displayOrder}
            </span>
          )}

          <button
            type="button"
            onClick={() => setFeatured(!featured)}
            title={featured ? 'Shown on the homepage. Click to remove.' : 'Add to the homepage testimonials section.'}
            aria-label={featured ? 'Remove from homepage' : 'Feature on homepage'}
            aria-pressed={featured ?? false}
            style={{
              fontSize: '0.72rem',
              padding: '0.25rem 0.6rem',
              borderRadius: 4,
              cursor: 'pointer',
              border: featured ? '1px solid #c9a227' : '1px solid rgba(155,154,154,0.3)',
              background: featured ? 'rgba(201,162,39,0.16)' : 'transparent',
              color: featured ? '#e8c468' : '#9b9a9a',
            }}
          >
            {featured ? (
              <>
                <span aria-hidden="true">★ </span>On homepage
              </>
            ) : (
              <>
                <span aria-hidden="true">☆ </span>Feature on homepage
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
