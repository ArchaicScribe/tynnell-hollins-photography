'use client'
import { useState } from 'react'
import { zipSync } from 'fflate'

type DownloadPhoto = {
  id: number
  filename: string | null
  url: string | null
}

type Props = {
  gallerySlug: string
  galleryTitle: string
  photos: DownloadPhoto[]
}

export function DownloadAllButton({ gallerySlug, galleryTitle, photos }: Props) {
  const [state, setState] = useState<'idle' | 'downloading' | 'zipping' | 'done'>('idle')
  const [progress, setProgress] = useState(0)

  const handleDownload = async () => {
    if (state !== 'idle') return
    setState('downloading')
    setProgress(0)

    try {
      const files: Record<string, Uint8Array> = {}
      const usedFilenames = new Set<string>()

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const proxyUrl = `/api/photos/${photo.id}/download?gallery=${gallerySlug}`
        const res = await fetch(proxyUrl)
        if (!res.ok) continue

        const buf = await res.arrayBuffer()

        // Ensure unique filename within the zip.
        let base = photo.filename ?? `photo-${photo.id}.jpg`
        if (usedFilenames.has(base)) {
          const dot = base.lastIndexOf('.')
          const name = dot >= 0 ? base.slice(0, dot) : base
          const ext = dot >= 0 ? base.slice(dot) : ''
          base = `${name}-${i + 1}${ext}`
        }
        usedFilenames.add(base)
        files[base] = new Uint8Array(buf)
        setProgress(i + 1)
      }

      setState('zipping')
      // STORE compression level (0) so we don't re-compress already-compressed JPEGs.
      const zipped = zipSync(files, { level: 0 })

      const blob = new Blob([zipped], { type: 'application/zip' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${galleryTitle.replace(/[^a-z0-9]+/gi, '-')}.zip`
      link.click()
      URL.revokeObjectURL(link.href)
      setState('idle')
    } catch {
      setState('idle')
    }
  }

  const total = photos.length
  const label =
    state === 'downloading' ? `Downloading (${progress}/${total})...` :
    state === 'zipping' ? 'Creating zip...' :
    `Download All (${total})`

  return (
    <button
      onClick={handleDownload}
      disabled={state !== 'idle'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 1.25rem',
        background: 'transparent',
        border: '1px solid rgba(214,209,206,0.3)',
        borderRadius: '4px',
        color: 'var(--color-heading)',
        fontSize: '0.82rem',
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.04em',
        cursor: state === 'idle' ? 'pointer' : 'default',
        opacity: state === 'idle' ? 1 : 0.6,
        transition: 'border-color 0.15s, opacity 0.15s',
      }}
    >
      {state === 'idle' && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {label}
    </button>
  )
}
