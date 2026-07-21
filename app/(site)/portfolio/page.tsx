import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import { getSiteConfig } from '@/app/lib/siteConfig'
import styles from './portfolio-landing.module.css'

export const revalidate = 120

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig()
  return {
    title: 'Portfolio',
    description: `Browse portraits, family sessions, and weddings by ${siteConfig.title}.`,
  }
}

const CATEGORIES = [
  {
    label: 'Portraits',
    href: '/portfolio/portraits',
    dbCategory: 'portraits',
    description: 'Intimate portraits that capture who you really are.',
  },
  {
    label: 'Family',
    href: '/portfolio/family',
    dbCategory: 'families',
    description: 'Real connection, easy laughter, bonds that tell your story.',
  },
  {
    label: 'Weddings',
    href: '/portfolio/weddings',
    dbCategory: 'weddings',
    description: 'Every wedding is a love story all its own.',
  },
]

export default async function PortfolioPage() {
  const payload = await getPayload({ config })
  const siteConfig = await getSiteConfig()

  const coverPhotos = await Promise.all(
    CATEGORIES.map(async cat => {
      const { docs } = await payload.find({
        collection: 'photos',
        where: {
          and: [
            { category: { equals: cat.dbCategory } },
            { featured: { equals: true } },
          ],
        },
        sort: '-updatedAt',
        limit: 1,
        depth: 0,
      })
      if (docs.length) return docs[0]

      const { docs: fallback } = await payload.find({
        collection: 'photos',
        where: { category: { equals: cat.dbCategory } },
        sort: 'displayOrder',
        limit: 1,
        depth: 0,
      })
      return fallback[0] ?? null
    })
  )

  const portfolioSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Portfolio',
    description: `Browse portraits, family sessions, and weddings by ${siteConfig.title}.`,
    url: 'https://tynnellhollinsphotography.com/portfolio',
    author: { '@type': 'Person', name: 'Tynnell Hollins', url: 'https://tynnellhollinsphotography.com/about' },
  }

  return (
    <main>
      <JsonLd data={portfolioSchema} />
      <div className={styles.tiles}>
        {CATEGORIES.map((cat, i) => {
          const photo = coverPhotos[i] as (Photo & { url?: string | null }) | null
          const imgUrl = photo?.sizes?.hero?.url ?? photo?.url ?? null

          return (
            <Link key={cat.href} href={cat.href} className={styles.tile} aria-label={cat.label}>
              {imgUrl && (
                <Image
                  src={imgUrl}
                  alt={cat.label}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={styles.tileImg}
                  priority={i === 0}
                />
              )}
              <div className={styles.tileOverlay} />
              <div className={styles.tileContent}>
                <h2 className={styles.tileTitle}>{cat.label}</h2>
                <p className={styles.tileDesc}>{cat.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
