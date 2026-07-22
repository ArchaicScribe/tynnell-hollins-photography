import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import { Render, resolveAllData } from '@measured/puck/rsc'
import type { Data } from '@measured/puck'
import config from '@payload-config'
import { config as puckConfig } from '@/app/builder/puck.config'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import ServicesGrid from './_components/ServicesGrid'
import styles from './page.module.css'

// Service packages/pricing rarely change - revalidate every 2 minutes
export const revalidate = 120

// A builder page can be promoted to replace this real route - same pattern
// as About/Portfolio (see collections/Pages.ts, app/(site)/about/page.tsx).
const getPromotedPage = cache(async () => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ promotedRoute: { equals: 'services' } }, { published: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
})

export async function generateMetadata(): Promise<Metadata> {
  const promoted = await getPromotedPage()
  if (promoted) return { title: promoted.title }
  return {
    title: 'Services',
    description: "Photography packages for weddings, portraits, families, couples, and brands. View pricing and what's included.",
  }
}

export default async function ServicesPage() {
  const promoted = await getPromotedPage()
  const payload = await getPayload({ config })
  const { docs: services } = await payload.find({
    collection: 'services',
    sort: 'displayOrder',
    depth: 0,
    limit: 50,
  })

  const servicesSchema = services.length > 0 ? {
    '@context': 'https://schema.org',
    '@graph': services.map(s => ({
      '@type': 'Service',
      name: s.title,
      description: s.description ?? undefined,
      url: 'https://tynnellhollinsphotography.com/services',
      provider: {
        '@type': 'LocalBusiness',
        name: 'Tynnell Hollins Photography',
        url: 'https://tynnellhollinsphotography.com',
      },
      ...(s.price ? {
        offers: {
          '@type': 'Offer',
          price: s.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      } : {}),
    })),
  } : null

  if (promoted) {
    const data = (promoted.content as Data | undefined) ?? { content: [], root: {} }
    return (
      <>
        {servicesSchema && <JsonLd data={servicesSchema} />}
        <Render config={puckConfig} data={await resolveAllData(data, puckConfig)} />
      </>
    )
  }

  return (
    <main className={styles.main}>
      {servicesSchema && <JsonLd data={servicesSchema} />}

      {/* Full-bleed hero */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>From Portraits to Weddings</p>
          <h1 className={styles.heroHeading}>Your Moments,<br />Beautifully Told</h1>
        </div>
      </section>

      <ServicesGrid
        services={services.map((s) => ({
          id: s.id,
          eyebrow: s.eyebrow ?? null,
          title: s.title,
          price: s.price ?? null,
          description: s.description ?? null,
          features: (s.features ?? []).map((f) => f.feature),
          depositAmount: s.depositAmount ?? null,
        }))}
      />

      {/* Bottom CTA */}
      <section className={styles.cta}>
        <p className={styles.ctaEyebrow}>Ready to begin?</p>
        <h2 className={styles.ctaHeading}>Let&apos;s Work Together</h2>
        <div className={styles.ctaActions}>
          <Link href="/book" className={styles.ctaBtn}>Book a Session</Link>
          <Link href="/contact" className={styles.ctaBtnSecondary}>Have Questions?</Link>
        </div>
      </section>
    </main>
  )
}
