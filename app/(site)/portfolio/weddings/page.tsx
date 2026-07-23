import { cache } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import { Render, resolveAllData } from '@measured/puck/rsc'
import type { Data } from '@measured/puck'
import config from '@payload-config'
import { config as puckConfig } from '@/app/builder/puck.config'
import type { Photo } from '@/payload-types'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import CategoryPhotoGrid, { type CategoryPhoto } from '../_components/CategoryPhotoGrid'
import AlbumGrid, { type AlbumItem } from '../_components/AlbumGrid'
import styles from '../_components/CategoryPage.module.css'

export const revalidate = 120

// A builder page can be promoted to replace this real route - same pattern
// as About/Portraits/Family (see collections/Pages.ts). Weddings needed both
// the PortfolioGrid AND AlbumGrid Puck blocks to exist first, since this
// page (unlike Portraits/Family) shows real Gallery album cards, not just a
// plain photo grid - promoting it before those blocks existed would have
// silently dropped that feature.
const getPromotedPage = cache(async () => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ promotedRoute: { equals: 'portfolio/weddings' } }, { published: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
})

const PROMOTED_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Weddings',
  description: 'Wedding photography in New Mexico and Seattle. Every wedding is a love story all its own.',
  url: 'https://tynnellhollinsphotography.com/portfolio/weddings',
}

export async function generateMetadata(): Promise<Metadata> {
  const promoted = await getPromotedPage()
  if (promoted) return { title: promoted.title }
  return {
    title: 'Weddings',
    description: 'Wedding photography in New Mexico and Seattle. Every wedding is a love story all its own.',
  }
}

export default async function WeddingsPage() {
  const promoted = await getPromotedPage()
  if (promoted) {
    const data = (promoted.content as Data | undefined) ?? { content: [], root: {} }
    return (
      <>
        <JsonLd data={PROMOTED_SCHEMA} />
        <Render config={puckConfig} data={await resolveAllData(data, puckConfig)} />
      </>
    )
  }

  const payload = await getPayload({ config })

  const [{ docs: rawPhotos }, { docs: rawGalleries }] = await Promise.all([
    payload.find({
      collection: 'photos',
      where: { category: { equals: 'weddings' } },
      sort: 'displayOrder',
      depth: 0,
      limit: 500,
    }),
    payload.find({
      collection: 'galleries',
      where: {
        and: [
          { category: { equals: 'weddings' } },
          { status: { not_equals: 'draft' } },
        ],
      },
      sort: 'displayOrder',
      depth: 1,
      limit: 100,
    }),
  ])

  const photos: CategoryPhoto[] = rawPhotos
    .filter(p => p.url)
    .map(p => ({
      id: String(p.id),
      title: p.title,
      alt: p.alt ?? undefined,
      caption: p.caption ?? null,
      imageUrl: (p as Photo).sizes?.card?.url ?? p.url ?? null,
      fullUrl: (p as Photo).sizes?.hero?.url ?? p.url ?? null,
    }))

  const albums: AlbumItem[] = rawGalleries.map(gallery => {
    const cover = typeof gallery.coverPhoto === 'object' && gallery.coverPhoto !== null
      ? gallery.coverPhoto as Photo
      : null
    const coverUrl = cover?.sizes?.card?.url ?? cover?.url ?? null
    const photoCount = Array.isArray(gallery.photos) ? gallery.photos.length : 0

    const previewUrls = (Array.isArray(gallery.photos) ? gallery.photos.slice(0, 5) : [])
      .map(item => {
        const p = typeof item.photo === 'object' && item.photo !== null ? item.photo as Photo : null
        return p?.sizes?.card?.url ?? p?.url ?? null
      })
      .filter((u): u is string => u !== null)

    return {
      id: gallery.id,
      slug: gallery.slug ?? '',
      title: gallery.title,
      coverUrl,
      coverAlt: cover?.alt ?? gallery.title,
      previewUrls,
      photoCount,
    }
  })

  const heroPhoto = rawPhotos.find(p => p.featured && p.url) ?? rawPhotos.find(p => p.url)
  const heroUrl = heroPhoto ? ((heroPhoto as Photo).sizes?.hero?.url ?? heroPhoto.url ?? null) : null

  return (
    <main>
      {/* Hero */}
      <section className={`${styles.hero}${!heroUrl ? ` ${styles.heroFallback}` : ''}`}>
        {heroUrl && (
          <Image
            src={heroUrl}
            alt="Wedding photography by Tynnell Hollins"
            fill
            priority
            className={styles.heroImg}
            sizes="100vw"
            quality={90}
          />
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.titleBox}>
            <h1 className={styles.title}>Weddings</h1>
          </div>
          <div className={styles.descBox}>
            <p className={styles.desc}>
              Every wedding is a love story all its own. I photograph the glances, the laughter, and the quiet moments in between.
            </p>
          </div>
        </div>
      </section>

      {/* Wedding albums */}
      <AlbumGrid albums={albums} />

      {/* Individual wedding photos */}
      {photos.length > 0 && <CategoryPhotoGrid photos={photos} />}

      {/* CTA */}
      <section className={styles.cta}>
        <p className={styles.ctaText}>{"Let's capture your day"}</p>
        <Link href="/book" className={styles.ctaBtn}>Book a consultation</Link>
      </section>
    </main>
  )
}
