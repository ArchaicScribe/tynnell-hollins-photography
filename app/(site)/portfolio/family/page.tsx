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
import { isPreviewMode } from '@/app/lib/builderPreview'
import styles from '../_components/CategoryPage.module.css'

export const revalidate = 120

// A builder page can be promoted to replace this real route - same pattern
// as About (see collections/Pages.ts, app/(site)/about/page.tsx).
const getPromotedPage = cache(async () => {
  const payload = await getPayload({ config })
  const preview = await isPreviewMode()
  const { docs } = await payload.find({
    collection: 'pages',
    where: preview
      ? { promotedRoute: { equals: 'portfolio/family' } }
      : { and: [{ promotedRoute: { equals: 'portfolio/family' } }, { published: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
})

const PROMOTED_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Family',
  description: 'Family portrait photography in Albuquerque and Seattle. Real connection, real moments, real laughter.',
  url: 'https://tynnellhollinsphotography.com/portfolio/family',
}

export async function generateMetadata(): Promise<Metadata> {
  const promoted = await getPromotedPage()
  if (promoted) return { title: promoted.title }
  return {
    title: 'Family',
    description: 'Family portrait photography in Albuquerque and Seattle. Real connection, real moments, real laughter.',
  }
}

export default async function FamilyPage() {
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

  const { docs: rawPhotos } = await payload.find({
    collection: 'photos',
    where: { category: { equals: 'families' } },
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
            alt="Family photography by Tynnell Hollins"
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
            <h1 className={styles.title}>Family</h1>
          </div>
          <div className={styles.descBox}>
            <p className={styles.desc}>
              Family is a thousand small moments. This gallery celebrates real connection, easy laughter, and the bonds that make your story your own.
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
