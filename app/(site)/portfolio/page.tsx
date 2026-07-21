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
import styles from './portfolio-landing.module.css'

export const revalidate = 120

// A builder page can be promoted to replace this real route - same pattern
// as About (see collections/Pages.ts, app/(site)/about/page.tsx).
const getPromotedPage = cache(async () => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ promotedRoute: { equals: 'portfolio' } }, { published: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
})

export async function generateMetadata(): Promise<Metadata> {
  const promoted = await getPromotedPage()
  if (promoted) return { title: promoted.title }
  return {
    title: 'Portfolio',
    description: 'Browse portraits, family sessions, and weddings by Tynnell Hollins Photography.',
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

// Static schema used for the promoted (Puck) branch - see about/page.tsx's
// PROMOTED_PERSON_SCHEMA for the same reasoning (no schema-aware block
// convention exists in this codebase, so this mirrors the hardcoded
// branch's portfolioSchema below rather than deriving from Puck props).
const PROMOTED_PORTFOLIO_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Portfolio',
  description: 'Browse portraits, family sessions, and weddings by Tynnell Hollins Photography.',
  url: 'https://tynnellhollinsphotography.com/portfolio',
  author: { '@type': 'Person', name: 'Tynnell Hollins', url: 'https://tynnellhollinsphotography.com/about' },
}

export default async function PortfolioPage() {
  const promoted = await getPromotedPage()
  if (promoted) {
    const data = (promoted.content as Data | undefined) ?? { content: [], root: {} }
    return (
      <>
        <JsonLd data={PROMOTED_PORTFOLIO_SCHEMA} />
        <Render config={puckConfig} data={await resolveAllData(data, puckConfig)} />
      </>
    )
  }

  const payload = await getPayload({ config })

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
    description: 'Browse portraits, family sessions, and weddings by Tynnell Hollins Photography.',
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
