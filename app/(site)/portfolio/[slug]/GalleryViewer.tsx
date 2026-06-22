'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ProtectedImage } from '@/app/components/ProtectedImage/ProtectedImage'
import styles from './page.module.css'

export type LightboxPhoto = {
  id: string | number
  thumbUrl: string | null
  fullUrl: string | null
  alt: string | null
  caption: string | null
}

type Props = {
  photos: LightboxPhoto[]
  taped: boolean
}

const NAV_BTN: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.14)',
  color: '#d6d1ce',
  width: 48,
  height: 48,
  borderRadius: '50%',
  cursor: 'pointer',
  fontSize: '1.1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1,
  backdropFilter: 'blur(4px)',
  transition: 'background 0.15s',
}

export function GalleryViewer({ photos, taped }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [imgLoading, setImgLoading] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const close = useCallback(() => setLightboxIdx(null), [])
  const prev = useCallback(() => { setImgLoading(true); setLightboxIdx(i => i !== null ? (i - 1 + photos.length) % photos.length : null) }, [photos.length])
  const next = useCallback(() => { setImgLoading(true); setLightboxIdx(i => i !== null ? (i + 1) % photos.length : null) }, [photos.length])

  const open = useCallback((i: number) => { setImgLoading(true); setLightboxIdx(i) }, [])

  useEffect(() => {
    if (lightboxIdx === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [lightboxIdx, close, prev, next])

  useEffect(() => {
    if (lightboxIdx === null || photos.length < 2) return
    const adjacentIdxs = [
      (lightboxIdx + 1) % photos.length,
      (lightboxIdx - 1 + photos.length) % photos.length,
    ]
    adjacentIdxs.forEach(i => {
      const url = photos[i]?.fullUrl ?? photos[i]?.thumbUrl
      if (url) { const img = new window.Image(); img.src = url }
    })
  }, [lightboxIdx, photos])

  if (photos.length === 0) {
    return <p className={styles.empty}>Photos coming soon.</p>
  }

  const current = lightboxIdx !== null ? photos[lightboxIdx] : null

  return (
    <>
      <div className={`${styles.grid}${taped ? ` ${styles.gridTaped}` : ''}`}>
        {photos.map((photo, i) => {
          if (!photo.thumbUrl) return null
          const image = (
            <div
              className={styles.imageSlot}
              style={{ cursor: 'zoom-in' }}
              role="button"
              tabIndex={0}
              aria-label={`Open photo ${i + 1}${photo.alt ? `: ${photo.alt}` : ''}`}
              onClick={() => open(i)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i) } }}
            >
              <ProtectedImage
                src={photo.thumbUrl}
                alt={photo.alt ?? ''}
                fill
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
                className={styles.photo}
              />
            </div>
          )
          return (
            <div
              key={String(photo.id)}
              className={`${styles.imageWrapper}${taped ? ` ${styles.tapedTilt}` : ''}`}
            >
              {taped ? <div className={styles.tapedMat}>{image}</div> : image}
              {photo.caption && <p className={styles.caption}>{photo.caption}</p>}
            </div>
          )
        })}
      </div>

      {current !== null && lightboxIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${lightboxIdx + 1} of ${photos.length}`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.96)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={close}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (touchStartX.current === null) return
            const delta = e.changedTouches[0].clientX - touchStartX.current
            touchStartX.current = null
            if (Math.abs(delta) < 50) return
            e.stopPropagation()
            if (delta < 0) next(); else prev()
          }}
        >
          {photos.length > 1 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); prev() }}
              aria-label="Previous photo"
              style={{ ...NAV_BTN, left: '1rem' }}
            >
              &#8592;
            </button>
          )}

          {/* Spinner - sibling of image so it stays centered in the flex overlay regardless of image dimensions */}
          {imgLoading && (
            <div aria-label="Loading image" style={{ position: 'absolute', pointerEvents: 'none' }}>
              <div style={{ width: 32, height: 32, border: '2px solid rgba(214,209,206,0.2)', borderTopColor: '#d6d1ce', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Photo - stop click from propagating to the close overlay */}
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.fullUrl ?? current.thumbUrl ?? ''}
              alt={current.alt ?? ''}
              draggable={false}
              onLoad={() => setImgLoading(false)}
              onContextMenu={e => e.preventDefault()}
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', display: 'block', userSelect: 'none', opacity: imgLoading ? 0 : 1, transition: 'opacity 0.2s' }}
            />
          </div>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); next() }}
              aria-label="Next photo"
              style={{ ...NAV_BTN, right: '1rem' }}
            >
              &#8594;
            </button>
          )}

          <button
            type="button"
            onClick={close}
            aria-label="Close lightbox"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#d6d1ce',
              width: 40,
              height: 40,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            &times;
          </button>

          <div
            style={{
              position: 'absolute',
              bottom: '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              minWidth: 0,
              maxWidth: '80vw',
            }}
          >
            {current.caption && (
              <p style={{ color: 'rgba(214,209,206,0.8)', fontFamily: 'var(--font-body)', fontSize: '0.75rem', letterSpacing: '0.08em', marginBottom: '0.4rem', margin: '0 0 0.4rem' }}>
                {current.caption}
              </p>
            )}
            <p style={{ color: 'rgba(155,154,154,0.6)', fontFamily: 'var(--font-body)', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>
              {lightboxIdx + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
