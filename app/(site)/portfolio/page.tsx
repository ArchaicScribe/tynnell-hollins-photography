import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import PortfolioGrid from './PortfolioGrid'
import type { PortfolioPhoto, PortfolioGallery } from './PortfolioGrid'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import styles from './page.module.css'

// Portfolio updates occasionally as photos are added - revalidate every 2 minutes
export const revalidate = 120

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Browse the full portfolio: weddings, portraits, families, couples, and more.',
}

export default async function PortfolioPage() {
  const payload = await getPayload({ config })

  const [{ docs: rawPhotos }, { docs: rawGalleries }] = await Promise.all([
    payload.find({ collection: 'photos', sort: 'displayOrder', depth: 0 }),
    payload.find({ collection: 'galleries', sort: 'displayOrder', depth: 1, where: { status: { not_equals: 'draft' } } }),
  ])

  const photos: PortfolioPhoto[] = rawPhotos.map(p => ({
    id: String(p.id),
    title: p.title,
    alt: p.alt ?? undefined,
    imageUrl: p.sizes?.card?.url ?? p.url ?? null,
    category: p.category ?? 'portraits',
  }))

  const galleries: PortfolioGallery[] = rawGalleries.map(g => {
    const cover = typeof g.coverPhoto === 'object' && g.coverPhoto !== null
      ? g.coverPhoto as Photo
      : null

    // gallery.photos is an ordered array of { photo: Photo | number } rows
    const previewUrls: string[] = Array.isArray(g.photos)
      ? g.photos
          .slice(0, 4)
          .map(item => {
            const p = item.photo
            return typeof p === 'object' && p !== null
              ? (p as Photo).sizes?.card?.url ?? (p as Photo).url ?? null
              : null
          })
          .filter((url): url is string => url !== null)
      : []

    return {
      id: String(g.id),
      title: g.title,
      slug: typeof g.slug === 'string' ? g.slug : '',
      category: g.category ?? 'weddings',
      featured: g.featured ?? false,
      coverImageUrl: cover?.sizes?.card?.url ?? cover?.url ?? null,
      coverImageAlt: cover?.alt ?? undefined,
      photoCount: Array.isArray(g.photos) ? g.photos.length : 0,
      previewUrls,
    }
  })

  const portfolioSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Portfolio',
    description: 'Browse the full portfolio: weddings, portraits, families, couples, and more.',
    url: 'https://tynnellhollinsphotography.com/portfolio',
    author: { '@type': 'Person', name: 'Tynnell Hollins', url: 'https://tynnellhollinsphotography.com/about' },
  }

  return (
    <main className={styles.main}>
      <JsonLd data={portfolioSchema} />
      <div className={styles.header}>
        <p className={styles.eyebrow}>The Work</p>
        <h1 className={styles.heading}>Portfolio</h1>
        <p className={styles.subheading}>Every story, every moment, every face</p>
      </div>
      <Suspense fallback={null}>
        <PortfolioGrid photos={photos} galleries={galleries} />
      </Suspense>
    </main>
  )
}
