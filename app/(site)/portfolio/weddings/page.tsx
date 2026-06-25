import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import CategoryPhotoGrid, { type CategoryPhoto } from '../_components/CategoryPhotoGrid'
import styles from '../_components/CategoryPage.module.css'
import albumStyles from './weddings.module.css'
import { ProtectedImage } from '@/app/components/ProtectedImage/ProtectedImage'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Weddings',
  description: 'Wedding photography in New Mexico and Seattle. Every wedding is a love story all its own.',
}

export default async function WeddingsPage() {
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
      imageUrl: (p as Photo).sizes?.card?.url ?? p.url ?? null,
      fullUrl: (p as Photo).sizes?.hero?.url ?? p.url ?? null,
    }))

  const heroPhoto = rawPhotos.find(p => p.featured && p.url) ?? rawPhotos.find(p => p.url)
  const heroUrl = heroPhoto ? ((heroPhoto as Photo).sizes?.hero?.url ?? heroPhoto.url ?? null) : null

  return (
    <main>
      {/* Hero */}
      <section className={styles.hero}>
        {heroUrl && (
          <Image
            src={heroUrl}
            alt="Wedding photography by Tynnell Hollins"
            fill
            priority
            className={styles.heroImg}
            sizes="100vw"
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
      {rawGalleries.length > 0 && (
        <section className={albumStyles.albums}>
          <h2 className={albumStyles.albumsHeading}>Albums</h2>
          <div className={albumStyles.albumGrid}>
            {rawGalleries.map(gallery => {
              const cover = typeof gallery.coverPhoto === 'object' && gallery.coverPhoto !== null
                ? gallery.coverPhoto as Photo
                : null
              const coverUrl = cover?.sizes?.card?.url ?? cover?.url ?? null
              const photoCount = Array.isArray(gallery.photos) ? gallery.photos.length : 0

              return (
                <Link key={gallery.id} href={`/portfolio/${gallery.slug}`} className={albumStyles.albumCard}>
                  <div className={albumStyles.albumCover}>
                    {coverUrl ? (
                      <ProtectedImage
                        src={coverUrl}
                        alt={cover?.alt ?? gallery.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className={albumStyles.albumImg}
                      />
                    ) : (
                      <div className={albumStyles.noCover} />
                    )}
                  </div>
                  <div className={albumStyles.albumFooter}>
                    <span className={albumStyles.albumTitle}>{gallery.title}</span>
                    <span className={albumStyles.albumMeta}>{photoCount} photos</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

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
