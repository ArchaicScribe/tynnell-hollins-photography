'use client'

import React from 'react'

type PhotoData = {
  thumbnailURL?: string | null
  url?: string | null
  sizes?: {
    thumbnail?: { url?: string | null } | null
  } | null
  title?: string | null
  alt?: string | null
}

type Props = {
  cellData?: PhotoData | string | number | null
  [key: string]: unknown
}

export const CoverPhotoCell: React.FC<Props> = ({ cellData }) => {
  if (!cellData || typeof cellData !== 'object') {
    return <span style={{ color: '#9B9A9A', fontSize: '12px' }}>No cover</span>
  }

  const photo = cellData as PhotoData
  const src = photo.thumbnailURL ?? photo.sizes?.thumbnail?.url ?? photo.url

  if (!src) {
    return <span style={{ color: '#9B9A9A', fontSize: '12px' }}>{photo.title ?? 'No image'}</span>
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={photo.alt ?? photo.title ?? ''}
      style={{
        width: '64px',
        height: '48px',
        objectFit: 'cover',
        borderRadius: '4px',
        display: 'block',
      }}
    />
  )
}
