'use client'
import { useState } from 'react'
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

export default function PortfolioGrid({ photos, galleries }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const paramCategory = searchParams.get('category') ?? 'all'
  const initialCategory = CATEGORIES.some(c => c.value === paramCategory) ? paramCategory : 'all'
  const [activeCategory, setActiveCategory] = useState(initialCategory)

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

  const filteredPhotos = activeCategory === 'all'
    ? photos
    : photos.filter(p => p.category === activeCategory)

  const weddingGalleries = galleries.filter(g => g.category === 'weddings')

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
                <div key={photo.id} className={`${styles.masonryItem} ${styles[`aspect${i % 5}`]}`}>
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
    </>
  )
}
