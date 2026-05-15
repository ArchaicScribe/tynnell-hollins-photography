import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import PortfolioGrid from './PortfolioGrid'
import type { PortfolioPhoto, PortfolioGallery } from './PortfolioGrid'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Portfolio | Tynnell Hollins Photography',
  description: 'Browse the full collection — weddings, portraits, families, couples, and more.',
}

export default async function PortfolioPage() {
  const payload = await getPayload({ config })

  const [{ docs: rawPhotos }, { docs: rawGalleries }] = await Promise.all([
    payload.find({ collection: 'photos', sort: 'displayOrder', depth: 0 }),
    payload.find({ collection: 'galleries', sort: 'displayOrder', depth: 1 }),
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
    return {
      id: String(g.id),
      title: g.title,
      slug: typeof g.slug === 'string' ? g.slug : '',
      category: g.category ?? 'weddings',
      featured: g.featured ?? false,
      coverImageUrl: cover?.sizes?.card?.url ?? cover?.url ?? null,
      coverImageAlt: cover?.alt ?? undefined,
      photoCount: Array.isArray(g.photos) ? g.photos.length : 0,
    }
  })

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>The Work</p>
        <h1 className={styles.heading}>Portfolio</h1>
        <p className={styles.subheading}>Every story, every moment, every face</p>
      </div>
      <PortfolioGrid photos={photos} galleries={galleries} />
    </main>
  )
}
