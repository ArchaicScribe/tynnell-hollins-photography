'use client'
import React, { useEffect, useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

type PhotoDoc = {
  url?: string | null
  sizes?: {
    hero?: { url?: string | null } | null
    card?: { url?: string | null } | null
  } | null
}

const CAT_LABELS: Record<string, string> = {
  'style-guide': 'Style Guide',
  'portrait-sessions': 'Portrait Sessions',
  'weddings': 'Weddings',
  'behind-the-lens': 'Behind the Lens',
  'client-education': 'Client Education',
}

export function PostEditHeader() {
  const { id } = useDocumentInfo()

  const title = useFormFields(([f]) => f.title?.value as string | undefined)
  const status = useFormFields(([f]) => f.status?.value as string | undefined)
  const category = useFormFields(([f]) => f.category?.value as string | undefined)
  const coverImageId = useFormFields(([f]) => {
    const v = f.coverImage?.value
    if (typeof v === 'number') return v
    if (v && typeof v === 'object' && 'id' in v) return (v as { id: number }).id
    return null
  })

  const [coverPhoto, setCoverPhoto] = useState<PhotoDoc | null>(null)
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    if (!coverImageId) { setCoverPhoto(null); return }
    let active = true
    fetch(`/api/photos/${coverImageId}?depth=0`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (active && d) setCoverPhoto(d) })
      .catch(() => {})
    return () => { active = false }
  }, [coverImageId])

  useEffect(() => { setImgFailed(false) }, [coverImageId])

  const coverUrl = !imgFailed
    ? (coverPhoto?.sizes?.hero?.url ?? coverPhoto?.sizes?.card?.url ?? coverPhoto?.url ?? null)
    : null

  const isPublished = status === 'published'
  const isNew = !id

  return (
    <div style={{
      width: '100%',
      marginBottom: '1.5rem',
      borderRadius: '4px',
      overflow: 'hidden',
      border: '1px solid rgba(155,154,154,0.12)',
      background: '#0f0f0f',
    }}>
      {/* Cover image strip */}
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt="Cover"
          onError={() => setImgFailed(true)}
          style={{
            width: '100%',
            height: 220,
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: coverImageId ? 220 : 72,
          background: '#131313',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {!coverImageId && (
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#4a4a4a', fontFamily: "'Roboto Mono', monospace", letterSpacing: '0.06em' }}>
              No cover photo selected
            </p>
          )}
        </div>
      )}

      {/* Meta row */}
      <div style={{
        padding: '0.85rem 1.1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        flexWrap: 'wrap',
        borderTop: coverUrl ? '1px solid rgba(155,154,154,0.1)' : 'none',
      }}>
        {/* Title */}
        <p style={{
          margin: 0, flex: 1, minWidth: 0,
          fontSize: '0.9rem',
          fontFamily: "'Archivo', sans-serif",
          fontWeight: 600,
          color: title ? '#D6D1CE' : '#4a4a4a',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title || (isNew ? 'New Post' : 'Untitled')}
        </p>

        {/* Category badge */}
        {category && (
          <span style={{
            fontSize: '0.6rem',
            fontFamily: "'Roboto Mono', monospace",
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#9B9A9A',
            background: 'rgba(155,154,154,0.1)',
            padding: '0.2rem 0.55rem',
            borderRadius: '999px',
            whiteSpace: 'nowrap',
          }}>
            {CAT_LABELS[category] ?? category}
          </span>
        )}

        {/* Status pill */}
        <span style={{
          fontSize: '0.6rem',
          fontFamily: "'Roboto Mono', monospace",
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          whiteSpace: 'nowrap',
          background: isPublished ? 'rgba(34,197,94,0.12)' : 'rgba(155,154,154,0.1)',
          color: isPublished ? '#4ade80' : '#9B9A9A',
          border: `1px solid ${isPublished ? 'rgba(74,222,128,0.25)' : 'rgba(155,154,154,0.2)'}`,
        }}>
          {isNew ? 'New' : (isPublished ? 'Published' : 'Draft')}
        </span>
      </div>
    </div>
  )
}
