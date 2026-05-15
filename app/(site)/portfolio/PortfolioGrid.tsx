'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import styles from './page.module.css'

const CATEGORIES = [
  { label: 'All',       value: 'all' },
  { label: 'Weddings',  value: 'weddings' },
  { label: 'Portraits', value: 'portraits' },
  { label: 'Families',  value: 'families' },
  { label: 'Couples',   value: 'couples' },
  { label: 'Brands',    value: 'brands' },
]

type Photo = {
  _id: string
  title: string
  alt: string
  image: object
  category: string
}

type Gallery = {
  _id: string
  title: string
  slug: { current: string }
  category: string
  featured: boolean
  coverImage: { _id: string; image: object; alt: string } | null
  photoCount: number
}

type Props = {
  photos: Photo[]
  galleries: Gallery[]
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
              key={gallery._id}
              href={`/portfolio/${gallery.slug.current}`}
              className={styles.galleryCard}
            >
              {gallery.coverImage ? (
                <Image
                  src={urlFor(gallery.coverImage.image).width(800).height(600).fit('crop').auto('format').url()}
                  alt={gallery.coverImage.alt ?? gallery.title}
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
            <div key={photo._id} className={styles.imageSlot}>
              <Image
                src={urlFor(photo.image).width(800).height(600).fit('crop').auto('format').url()}
                alt={photo.alt ?? photo.title}
                fill
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
                className={styles.photo}
              />
            </div>
          )) : (
            <p className={styles.empty}>No photos in this category yet.</p>
          )}
        </div>
      )}
    </>
  )
}
