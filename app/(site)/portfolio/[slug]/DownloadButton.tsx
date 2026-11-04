'use client'
import { useState } from 'react'
import { zipSync } from 'fflate'
import { collectDownloads, type DownloadPhoto } from './collectDownloads'

type Props = {
  gallerySlug: string
  galleryTitle: string
  photos: DownloadPhoto[]
}

export function DownloadAllButton({ gallerySlug, galleryTitle, photos }: Props) {
  const [state, setState] = useState<'idle' | 'downloading' | 'zipping' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    if (state !== 'idle') return
    setState('downloading')
    setProgress(0)
    setError(null)

    try {
      const { files, failed, unauthorized } = await collectDownloads(photos, gallerySlug, setProgress)

      // Never hand the visitor an empty zip: say what went wrong instead.
      if (unauthorized) {
        setError('Your access to this gallery has expired. Reload the page and enter the password again.')
        setState('idle')
        return
      }
      if (Object.keys(files).length === 0) {
        setError('The photos could not be downloaded. Please try again, or contact us if it keeps happening.')
        setState('idle')
        return
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
      if (failed > 0) {
        setError(`${failed} of ${photos.length} photos could not be downloaded and are missing from the zip.`)
      }
      setState('idle')
    } catch {
      setError('Something went wrong creating the download. Please try again.')
      setState('idle')
    }
  }
  const total = photos.length
  const label =
    state === 'downloading' ? `Downloading (${progress}/${total})...` :
    state === 'zipping' ? 'Creating zip...' :
    `Download All (${total})`

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
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
      {error && (
        <span role="alert" style={{ maxWidth: '22rem', textAlign: 'right', fontSize: '0.78rem', fontFamily: 'var(--font-body)', color: 'var(--color-heading)' }}>
          {error}
        </span>
      )}
    </span>
  )
}
