import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import styles from './page.module.css'

// Service packages/pricing rarely change - revalidate every 2 minutes
export const revalidate = 120

export const metadata: Metadata = {
  title: 'Services',
  description: "Photography packages for weddings, portraits, families, couples, and brands. View pricing and what's included.",
}

export default async function ServicesPage() {
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

      {/* Service cards */}
      <section className={styles.cards} aria-label="Service packages">
        {services.length > 0 ? services.map((service, i) => (
          <article key={service.id} className={`${styles.card} ${i % 2 === 1 ? styles.cardAlt : ''}`}>
            <div className={styles.cardBody}>
              {service.eyebrow && (
                <p className={styles.cardEyebrow}>{service.eyebrow}</p>
              )}
              <h2 className={styles.cardTitle}>{service.title}</h2>

              {service.price && (
                <p className={styles.cardPrice}>{service.price}</p>
              )}

              {service.description && (
                <p className={styles.cardDescription}>{service.description}</p>
              )}

              {service.features && service.features.length > 0 && (
                <ul className={styles.featureList}>
                  {service.features.map((item, fi) => (
                    <li key={fi} className={styles.featureItem}>
                      <span className={styles.featureDot} aria-hidden="true" />
                      {item.feature}
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.cardActions}>
                <Link
                  href={`/book?package=${service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                  className={styles.bookBtn}
                  aria-label={`Book ${service.title} session`}
                >
                  Reserve Your Date
                </Link>
                {service.depositAmount != null && (
                  <p className={styles.depositNote}>
                    ${service.depositAmount.toLocaleString()} deposit to secure
                  </p>
                )}
              </div>
            </div>
          </article>
        )) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyEyebrow}>Coming Soon</p>
            <p className={styles.emptyText}>Packages are being finalised. Reach out directly to discuss your vision.</p>
            <Link href="/contact" className={styles.bookBtn}>Get in Touch</Link>
          </div>
        )}
      </section>

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
