'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
  title: string
  alt?: string
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
}

type Props = {
  photos: PortfolioPhoto[]
  galleries: PortfolioGallery[]
}

export default function PortfolioGrid({ photos, galleries }: Props) {
  const [activeCategory, setActiveCategory] = useState('all')

  const showAlbums = activeCategory === 'weddings'

  const filteredPhotos = activeCategory === 'all'
    ? photos
    : photos.filter(p => p.category === activeCategory)

  const weddingGalleries = galleries.filter(g => g.category === 'weddings')

  return (
    <>
      {/* Category filter */}
      <div className={styles.filterBar}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            className={`${styles.filterBtn} ${activeCategory === cat.value ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Wedding albums grid */}
      {showAlbums && (
        <div className={styles.grid}>
          {weddingGalleries.length > 0 ? weddingGalleries.map(gallery => (
            <Link
              key={gallery.id}
              href={`/portfolio/${gallery.slug}`}
              className={styles.galleryCard}
            >
              {gallery.coverImageUrl ? (
                <Image
                  src={gallery.coverImageUrl}
                  alt={gallery.coverImageAlt ?? gallery.title}
                  fill
                  sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
                  className={styles.photo}
                />
              ) : (
                <div className={styles.nocover} />
              )}
              <div className={styles.galleryOverlay}>
                <span className={styles.galleryTitle}>{gallery.title}</span>
                <span className={styles.galleryCount}>{gallery.photoCount} photos</span>
              </div>
            </Link>
          )) : (
            <p className={styles.empty}>No wedding albums yet.</p>
          )}
        </div>
      )}

      {/* Flat photo grid */}
      {!showAlbums && (
        <div className={styles.grid}>
          {filteredPhotos.length > 0 ? filteredPhotos.map(photo => (
            photo.imageUrl ? (
              <div key={photo.id} className={styles.imageSlot}>
                <Image
                  src={photo.imageUrl}
                  alt={photo.alt ?? photo.title}
                  fill
                  sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
                  className={styles.photo}
                />
              </div>
            ) : null
          )) : (
            <p className={styles.empty}>No photos in this category yet.</p>
          )}
        </div>
      )}
    </>
  )
}
