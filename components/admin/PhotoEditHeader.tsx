'use client'
import React, { useEffect, useState } from 'react'
import { useDocumentInfo, useField, useFormFields } from '@payloadcms/ui'

// Custom photo edit header (TYN-228 photo editor revamp). Renders a large
// preview + at-a-glance metadata + an interactive Featured toggle + gallery
// membership on top of Payload's standard form (which still owns Save,
// validation, and the upload field). Built as a `ui` field at the top of the
// Photos edit view. 'use client' + inline styles so it survives a CSS/hydration
// hiccup like the rest of the admin chrome.
type PhotoDoc = {
  url?: string | null
  filename?: string | null
  width?: number | null
  height?: number | null
  filesize?: number | null
  mimeType?: string | null
  sizes?: { card?: { url?: string | null }; thumbnail?: { url?: string | null } } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  weddings: 'Weddings',
  portraits: 'Portraits',
  families: 'Families',
  couples: 'Couples',
  brands: 'Brands',
}

function formatSize(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PhotoEditHeader() {
  const { id } = useDocumentInfo()
  const { value: featured, setValue: setFeatured } = useField<boolean>({ path: 'featured' })
  const category = useFormFields(([fields]) => fields.category?.value as string | undefined)

  const [doc, setDoc] = useState<PhotoDoc | null>(null)
  const [galleries, setGalleries] = useState<string[]>([])
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    ;(async () => {
      // The two fetches are independent, so run them together.
      const [photoRes, galleriesRes] = await Promise.allSettled([
        fetch(`/api/photos/${id}?depth=0`, { credentials: 'include' }),
        fetch('/api/galleries?limit=300&depth=0', { credentials: 'include' }),
      ])
      if (!active) return

      if (photoRes.status === 'fulfilled' && photoRes.value.ok) {
        try {
          setDoc(await photoRes.value.json())
        } catch {
          /* preview is non-critical */
        }
      }

      if (galleriesRes.status === 'fulfilled' && galleriesRes.value.ok) {
        try {
          const data = await galleriesRes.value.json()
          const names = (data?.docs ?? [])
            .filter((g: { photos?: { photo?: number | string }[] }) =>
              Array.isArray(g.photos) && g.photos.some((p) => String(p?.photo) === String(id)),
            )
            .map((g: { title?: string }) => g.title)
            .filter(Boolean)
          setGalleries(names)
        } catch {
          /* membership is non-critical */
        }
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  // New, unsaved photo: nothing to preview yet.
  if (!id) return null

  const previewUrl = doc?.sizes?.card?.url ?? doc?.url ?? null
  const dims = doc?.width && doc?.height ? `${doc.width} x ${doc.height}` : null
  const size = formatSize(doc?.filesize)
  const type = doc?.mimeType ?? null
  const metaBits = [dims, size, type].filter(Boolean).join('  -  ')

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
            alt={doc?.filename ?? 'Photo preview'}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: '#6b6a6a', fontSize: '0.78rem', textAlign: 'center', padding: '0 1rem', lineHeight: 1.5 }}>
            {previewUrl ? 'Preview shows on the live site' : 'No image yet'}
          </span>
        )}
      </div>

      {/* Meta + actions */}
      <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div>
          <div style={{ color: '#d6d1ce', fontSize: '0.95rem', fontFamily: "var(--font-mono, 'Roboto Mono', monospace)", wordBreak: 'break-all' }}>
            {doc?.filename ?? 'Loading...'}
          </div>
          {metaBits && (
            <div style={{ color: '#6b6a6a', fontSize: '0.74rem', marginTop: '0.3rem', letterSpacing: '0.03em' }}>{metaBits}</div>
          )}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '0.25rem 0.6rem',
              borderRadius: 4,
              border: '1px solid rgba(155,154,154,0.3)',
              color: category ? '#c8c3c0' : '#6b6a6a',
            }}
          >
            {category ? (CATEGORY_LABELS[category] ?? category) : 'No category'}
          </span>

          <button
            type="button"
            onClick={() => setFeatured(!featured)}
            title={featured ? 'Shown on the homepage. Click to remove.' : 'Add to the homepage portfolio preview.'}
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
            {featured ? '★ On homepage' : '☆ Feature on homepage'}
          </button>
        </div>

        {/* Gallery membership */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ color: '#6b6a6a', fontSize: '0.72rem' }}>In galleries:</span>
          {galleries.length === 0 ? (
            <span style={{ color: '#6b6a6a', fontSize: '0.72rem', fontStyle: 'italic' }}>none yet</span>
          ) : (
            galleries.map((name) => (
              <span
                key={name}
                style={{
                  fontSize: '0.72rem',
                  padding: '0.22rem 0.55rem',
                  borderRadius: 4,
                  background: 'rgba(155,154,154,0.12)',
                  color: '#c8c3c0',
                }}
              >
                {name}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
