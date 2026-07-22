import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import { Render, resolveAllData } from '@measured/puck/rsc'
import type { Data } from '@measured/puck'
import config from '@payload-config'
import { config as puckConfig } from '@/app/builder/puck.config'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import TestimonialsList from './_components/TestimonialsList'
import styles from './page.module.css'
import type { Photo } from '@/payload-types'

export const revalidate = 120

// A builder page can be promoted to replace this real route - same pattern
// as About/Portfolio/Services (see collections/Pages.ts, app/(site)/about/page.tsx).
const getPromotedPage = cache(async () => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ promotedRoute: { equals: 'testimonials' } }, { published: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
})

export async function generateMetadata(): Promise<Metadata> {
  const promoted = await getPromotedPage()
  if (promoted) return { title: promoted.title }
  return {
    title: 'Client Words | Tynnell Hollins Photography',
    description: 'Kind words from couples, families, and portrait clients who have worked with Tynnell Hollins Photography.',
  }
}

export default async function TestimonialsPage() {
  const promoted = await getPromotedPage()
  const payload = await getPayload({ config })
  const { docs: testimonials } = await payload.find({
    collection: 'testimonials',
    sort: 'displayOrder',
    depth: 1,
    limit: 200,
  })

  const reviewSchema = testimonials.length > 0 ? {
    '@context': 'https://schema.org',
    '@graph': testimonials.map(t => ({
      '@type': 'Review',
      reviewBody: t.quote,
      author: { '@type': 'Person', name: t.clientName },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      itemReviewed: {
        '@type': 'LocalBusiness',
        name: 'Tynnell Hollins Photography',
        url: 'https://tynnellhollinsphotography.com',
      },
    })),
  } : null

  if (promoted) {
    const data = (promoted.content as Data | undefined) ?? { content: [], root: {} }
    return (
      <>
        {reviewSchema && <JsonLd data={reviewSchema} />}
        <Render config={puckConfig} data={await resolveAllData(data, puckConfig)} />
      </>
    )
  }

  return (
    <main className={styles.page}>
      {reviewSchema && <JsonLd data={reviewSchema} />}

      {/* Hero with handwritten script background */}
      <div className={styles.hero}>
        <div className={styles.scriptBg} aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={styles.scriptLine}>
              {`Every moment captured in light and shadow, a story told through the lens of love and laughter, hearts intertwined in the dance of forever, treasured memories woven into the fabric of time, whispered promises and stolen glances preserved`}
            </span>
          ))}
        </div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeading}>Their Words Tell It Best</h1>
          <p className={styles.heroSub}>
            From big days to small breaths, these words echo the real life inside each photo.
          </p>
        </div>
      </div>

      <TestimonialsList
        testimonials={testimonials.map((t) => {
          const photo = t.photo && typeof t.photo === 'object' ? t.photo as Photo : null
          return {
            id: t.id,
            sessionType: t.sessionType ?? null,
            clientName: t.clientName,
            quote: t.quote,
            photoUrl: photo?.sizes?.card?.url ?? photo?.sizes?.thumbnail?.url ?? photo?.url ?? null,
            photoWidth: photo?.sizes?.card?.width ?? photo?.sizes?.thumbnail?.width ?? photo?.width ?? null,
            photoHeight: photo?.sizes?.card?.height ?? photo?.sizes?.thumbnail?.height ?? photo?.height ?? null,
          }
        })}
      />

      {/* CTA */}
      <div className={styles.cta}>
        <p className={styles.ctaEyebrow}>Ready to create your story?</p>
        <h2 className={styles.ctaHeading}>Let&apos;s Work Together</h2>
        <Link href="/contact" className={styles.ctaBtn}>Book a Session</Link>
      </div>
    </main>
  )
}
