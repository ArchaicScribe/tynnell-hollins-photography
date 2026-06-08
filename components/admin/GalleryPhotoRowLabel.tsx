'use client'
import React from 'react'
import { useRowLabel } from '@payloadcms/ui'

type PhotoData = {
  id?: number | null
  title?: string | null
  filename?: string | null
  url?: string | null
  sizes?: {
    thumbnail?: { url?: string | null } | null
  } | null
}

export function GalleryPhotoRowLabel() {
  const { data, rowNumber } = useRowLabel<{ photo?: PhotoData | number | null }>()

  const photo = data?.photo && typeof data.photo === 'object' ? (data.photo as PhotoData) : null
  const thumbUrl = photo?.sizes?.thumbnail?.url ?? photo?.url ?? null
  const label = photo?.title ?? photo?.filename ?? `Photo ${rowNumber}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      {thumbUrl && (
        <img
          src={thumbUrl}
          alt=""
          style={{
            width: '32px',
            height: '32px',
            objectFit: 'cover',
            borderRadius: '3px',
            flexShrink: 0,
          }}
        />
      )}
      <span style={{ fontSize: '0.8rem', color: '#D6D1CE', fontFamily: "'Archivo', sans-serif" }}>
        {label}
      </span>
    </div>
  )
}
