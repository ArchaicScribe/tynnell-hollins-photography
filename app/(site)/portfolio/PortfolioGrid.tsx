'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ProtectedImage } from '@/app/components/ProtectedImage/ProtectedImage'
import styles from './page.module.css'

const CATEGORIES = [
  { label: 'All',       value: 'all' },
  { label: 'Weddings',  value: 'weddings' },
  { label: 'Portraits', value: 'portraits' },
  { label: 'Families',  value: 'families' },
  { label: 'Couples',   value: 'couples' },
  { label: 'Brands',    value: 'brands' },
]

export type PortfolioPhoto = {
  id: string
  title?: string | null
  alt?: string | null
  imageUrl: string | null
  fullUrl: string | null
  category: string
}

export type PortfolioGallery = {
  id: string
  title: string
  slug: string
  category: string
  featured: boolean
  coverImageUrl: string | null
  coverImageAlt?: string
  photoCount: number
  previewUrls: string[]
}

type Props = {
  photos: PortfolioPhoto[]
  galleries: PortfolioGallery[]
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

export default function PortfolioGrid({ photos, galleries }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const paramCategory = searchParams.get('category') ?? 'all'
  const initialCategory = CATEGORIES.some(c => c.value === paramCategory) ? paramCategory : 'all'
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [imgLoading, setImgLoading] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const visiblePhotos = activeCategory === 'all'
    ? photos
    : photos.filter(p => p.category === activeCategory)

  const closeLightbox = useCallback(() => setLightboxIdx(null), [])
  const prevPhoto = useCallback(() => { setImgLoading(true); setLightboxIdx(i => i !== null ? (i - 1 + visiblePhotos.length) % visiblePhotos.length : null) }, [visiblePhotos.length])
  const nextPhoto = useCallback(() => { setImgLoading(true); setLightboxIdx(i => i !== null ? (i + 1) % visiblePhotos.length : null) }, [visiblePhotos.length])
  const openPhoto = useCallback((i: number) => { setImgLoading(true); setLightboxIdx(i) }, [])

  useEffect(() => {
    if (lightboxIdx === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      else if (e.key === 'ArrowLeft') prevPhoto()
      else if (e.key === 'ArrowRight') nextPhoto()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [lightboxIdx, closeLightbox, prevPhoto, nextPhoto])

  useEffect(() => { setLightboxIdx(null) }, [activeCategory])

  function handleFilter(value: string) {
    setActiveCategory(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  const showAlbums = activeCategory === 'weddings'

  const filteredPhotos = visiblePhotos

  const weddingGalleries = galleries.filter(g => g.category === 'weddings')
  const currentLightboxPhoto = lightboxIdx !== null ? visiblePhotos[lightboxIdx] : null

  return (
    <>
      {/* Category filter */}
      <div className={styles.filterBar} role="group" aria-label="Filter by category">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            className={`${styles.filterBtn} ${activeCategory === cat.value ? styles.filterBtnActive : ''}`}
            onClick={() => handleFilter(cat.value)}
            aria-pressed={activeCategory === cat.value}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Wedding album cards */}
      {showAlbums && (
        <div className={styles.albumGrid}>
          {weddingGalleries.length > 0 ? weddingGalleries.map(gallery => (
            <Link
              key={gallery.id}
              href={`/portfolio/${gallery.slug}?from=weddings`}
              className={styles.albumCard}
            >
              <div className={styles.albumCover}>
                {gallery.coverImageUrl ? (
                  <ProtectedImage
                    src={gallery.coverImageUrl}
                    alt={gallery.coverImageAlt ?? gallery.title}
                    fill
                    sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
                    className={styles.photo}
                  />
                ) : (
                  <div className={styles.nocover} />
                )}
              </div>
              {gallery.previewUrls.length > 0 && (
                <div className={styles.albumPreviews}>
                  {gallery.previewUrls.slice(0, 3).map((url, i) => (
                    <div key={i} className={styles.albumPreview}>
                      <ProtectedImage
                        src={url}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 33vw, 11vw"
                        className={styles.photo}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.albumFooter}>
                <span className={styles.albumTitle}>{gallery.title}</span>
                <span className={styles.albumMeta}>{gallery.photoCount} photos <span aria-hidden="true">&rarr;</span></span>
              </div>
            </Link>
          )) : (
            <p className={styles.empty}>No wedding albums yet.</p>
          )}
        </div>
      )}

      {/* Masonry photo grid */}
      {!showAlbums && (
        filteredPhotos.length > 0 ? (
          <div className={styles.masonry}>
            {filteredPhotos.map((photo, i) =>
              photo.imageUrl ? (
                <div
                  key={photo.id}
                  className={`${styles.masonryItem} ${styles[`aspect${i % 5}`]}`}
                  style={{ cursor: 'zoom-in' }}
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
                    sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
                    className={styles.photo}
                  />
                  {photo.title && (
                    <div className={styles.photoOverlay}>
                      <span className={styles.photoTitle}>{photo.title}</span>
                    </div>
                  )}
                </div>
              ) : null
            )}
          </div>
        ) : (
          <p className={styles.empty}>No photos in this category yet.</p>
        )
      )}

      {/* Lightbox */}
      {currentLightboxPhoto !== null && lightboxIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${lightboxIdx + 1} of ${visiblePhotos.length}`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.96)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
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
          {visiblePhotos.length > 1 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); prevPhoto() }}
              aria-label="Previous photo"
              style={{ ...NAV_BTN, left: '1rem' }}
            >
              &#8592;
            </button>
          )}
          {imgLoading && (
            <div aria-label="Loading image" style={{ position: 'absolute', pointerEvents: 'none' }}>
              <div style={{ width: 32, height: 32, border: '2px solid rgba(214,209,206,0.2)', borderTopColor: '#d6d1ce', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentLightboxPhoto.fullUrl ?? currentLightboxPhoto.imageUrl ?? ''}
              alt={currentLightboxPhoto.alt ?? currentLightboxPhoto.title ?? ''}
              draggable={false}
              onLoad={() => setImgLoading(false)}
              onContextMenu={e => e.preventDefault()}
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', display: 'block', userSelect: 'none', opacity: imgLoading ? 0 : 1, transition: 'opacity 0.2s' }}
            />
          </div>
          {visiblePhotos.length > 1 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); nextPhoto() }}
              aria-label="Next photo"
              style={{ ...NAV_BTN, right: '1rem' }}
            >
              &#8594;
            </button>
          )}
          <button
            type="button"
            onClick={closeLightbox}
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
            }}
          >
            {currentLightboxPhoto.title && (
              <p style={{ color: 'rgba(214,209,206,0.8)', fontFamily: 'var(--font-body)', fontSize: '0.75rem', letterSpacing: '0.08em', margin: '0 0 0.4rem' }}>
                {currentLightboxPhoto.title}
              </p>
            )}
            <p style={{ color: 'rgba(155,154,154,0.6)', fontFamily: 'var(--font-body)', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>
              {lightboxIdx + 1} / {visiblePhotos.length}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
