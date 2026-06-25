'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ProtectedImage } from '@/app/components/ProtectedImage/ProtectedImage'
import styles from './CategoryPhotoGrid.module.css'

export type CategoryPhoto = {
  id: string
  title?: string | null
  alt?: string | null
  imageUrl: string | null
  fullUrl: string | null
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
  backdropFilter: 'blur(4px)',
}

export default function CategoryPhotoGrid({ photos }: { photos: CategoryPhoto[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [imgLoading, setImgLoading] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const closeLightbox = useCallback(() => setLightboxIdx(null), [])
  const prevPhoto = useCallback(() => { setImgLoading(true); setLightboxIdx(i => i !== null ? (i - 1 + photos.length) % photos.length : null) }, [photos.length])
  const nextPhoto = useCallback(() => { setImgLoading(true); setLightboxIdx(i => i !== null ? (i + 1) % photos.length : null) }, [photos.length])

  const openPhoto = useCallback((i: number) => {
    previousFocusRef.current = document.activeElement as HTMLElement
    setImgLoading(true)
    setLightboxIdx(i)
  }, [])

  useEffect(() => {
    if (lightboxIdx !== null) closeBtnRef.current?.focus()
    else previousFocusRef.current?.focus()
  }, [lightboxIdx])

  useEffect(() => {
    if (lightboxIdx === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      else if (e.key === 'ArrowLeft') prevPhoto()
      else if (e.key === 'ArrowRight') nextPhoto()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [lightboxIdx, closeLightbox, prevPhoto, nextPhoto])

  useEffect(() => {
    if (lightboxIdx === null || photos.length < 2) return
    const adjacentIdxs = [(lightboxIdx + 1) % photos.length, (lightboxIdx - 1 + photos.length) % photos.length]
    adjacentIdxs.forEach(i => {
      const url = photos[i]?.fullUrl ?? photos[i]?.imageUrl
      if (url) { const img = new window.Image(); img.src = url }
    })
  }, [lightboxIdx, photos])

  const currentPhoto = lightboxIdx !== null ? photos[lightboxIdx] : null

  if (!photos.length) {
    return (
      <div className={styles.emptySection}>
        <p className={styles.emptyEyebrow}>Coming Soon</p>
        <p className={styles.emptyHeading}>Photos on the Way</p>
        <p className={styles.emptyBody}>This gallery is being curated. Check back soon, or explore the full portfolio in the meantime.</p>
        <div className={styles.emptyActions}>
          <Link href="/portfolio" className={styles.emptyBtn}>View All Work</Link>
          <Link href="/contact" className={styles.emptyBtnSecondary}>Book a Session</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.grid}>
        {photos.map((photo, i) =>
          photo.imageUrl ? (
            <div
              key={photo.id}
              className={styles.cell}
              role="button"
              tabIndex={0}
              aria-label={`View photo${photo.alt ? `: ${photo.alt}` : photo.title ? `: ${photo.title}` : ''}`}
              onClick={() => openPhoto(i)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPhoto(i) } }}
            >
              <ProtectedImage
                src={photo.imageUrl}
                alt={photo.alt ?? photo.title ?? ''}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className={styles.img}
              />
            </div>
          ) : null
        )}
      </div>

      {currentPhoto !== null && lightboxIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${lightboxIdx + 1} of ${photos.length}`}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={closeLightbox}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (touchStartX.current === null) return
            const delta = e.changedTouches[0].clientX - touchStartX.current
            touchStartX.current = null
            if (Math.abs(delta) < 50) return
            e.stopPropagation()
            if (delta < 0) nextPhoto(); else prevPhoto()
          }}
        >
          {photos.length > 1 && (
            <button type="button" onClick={e => { e.stopPropagation(); prevPhoto() }} aria-label="Previous photo" style={{ ...NAV_BTN, left: '1rem' }}>&#8592;</button>
          )}
          {imgLoading && (
            <div aria-label="Loading image" style={{ position: 'absolute', pointerEvents: 'none' }}>
              <div style={{ width: 32, height: 32, border: '2px solid rgba(214,209,206,0.2)', borderTopColor: '#d6d1ce', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhoto.fullUrl ?? currentPhoto.imageUrl ?? ''}
              alt={currentPhoto.alt ?? currentPhoto.title ?? ''}
              draggable={false}
              onLoad={() => setImgLoading(false)}
              onContextMenu={e => e.preventDefault()}
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', display: 'block', userSelect: 'none', opacity: imgLoading ? 0 : 1, transition: 'opacity 0.2s' }}
            />
          </div>
          {photos.length > 1 && (
            <button type="button" onClick={e => { e.stopPropagation(); nextPhoto() }} aria-label="Next photo" style={{ ...NAV_BTN, right: '1rem' }}>&#8594;</button>
          )}
          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeLightbox}
            aria-label="Close lightbox"
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#d6d1ce', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          >
            &times;
          </button>
          <p style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', color: 'rgba(155,154,154,0.6)', fontFamily: 'var(--font-body)', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap' }}>
            {lightboxIdx + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  )
}
