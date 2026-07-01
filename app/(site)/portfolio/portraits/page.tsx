import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import CategoryPhotoGrid, { type CategoryPhoto } from '../_components/CategoryPhotoGrid'
import styles from '../_components/CategoryPage.module.css'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Portraits',
  description: 'Intimate portrait photography in Albuquerque and Seattle. Tynnell Hollins captures the real you.',
}

export default async function PortraitsPage() {
  const payload = await getPayload({ config })

  const { docs: rawPhotos } = await payload.find({
    collection: 'photos',
    where: { category: { equals: 'portraits' } },
    sort: 'displayOrder',
    depth: 0,
    limit: 500,
  })

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

  const heroPhoto = rawPhotos.find(p => p.featured && p.url) ?? rawPhotos.find(p => p.url)
  const heroUrl = heroPhoto ? ((heroPhoto as Photo).sizes?.hero?.url ?? heroPhoto.url ?? null) : null

  return (
    <main>
      {/* Hero */}
      <section className={`${styles.hero}${!heroUrl ? ` ${styles.heroFallback}` : ''}`}>
        {heroUrl && (
          <Image
            src={heroUrl}
            alt="Portrait photography by Tynnell Hollins"
            fill
            priority
            className={styles.heroImg}
            sizes="100vw"
          />
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.titleBox}>
            <h1 className={styles.title}>Portraits</h1>
          </div>
          <div className={styles.descBox}>
            <p className={styles.desc}>
              Intimate portraits that capture who you really are. Not just how you look, but how you feel.
            </p>
          </div>
        </div>
      </section>

      {/* Photo grid */}
      <CategoryPhotoGrid photos={photos} />

      {/* CTA */}
      <section className={styles.cta}>
        <p className={styles.ctaText}>Ready to tell your story?</p>
        <Link href="/book" className={styles.ctaBtn}>Book a session</Link>
      </section>
    </main>
  )
}
