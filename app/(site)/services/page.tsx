import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import styles from './page.module.css'

// Service packages change rarely — revalidate every 2 minutes
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
  })

  return (
    <main className={styles.main}>

      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Services</p>
        <h1 className={styles.heroHeading}>{"Let's Create"}<br />{"Something Beautiful"}</h1>
        <p className={styles.heroSub}>
          {"Every package is crafted to give you images you'll treasure for a lifetime."}
        </p>
      </section>

      {/* Service cards */}
      <section className={styles.grid} aria-label="Service packages">
        {services.length > 0 ? services.map((service) => (
          <article key={service.id} className={styles.card}>

            <div className={styles.cardTop}>
              {service.eyebrow && (
                <p className={styles.cardEyebrow}>{service.eyebrow}</p>
              )}
              <h2 className={styles.cardTitle}>{service.title}</h2>

              <div className={styles.priceRow}>
                {service.price && (
                  <p className={styles.cardPrice}>{service.price}</p>
                )}
                {service.depositAmount != null && (
                  <p className={styles.depositBadge}>
                    ${service.depositAmount.toLocaleString()} deposit to reserve
                  </p>
                )}
              </div>
            </div>

            {service.description && (
              <p className={styles.cardDescription}>{service.description}</p>
            )}

            {service.features && service.features.length > 0 && (
              <ul className={styles.featureList}>
                {service.features.map((item, i) => (
                  <li key={i} className={styles.featureItem}>
                    {item.feature}
                  </li>
                ))}
              </ul>
            )}

            <Link
              href={`/book?package=${service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
              className={styles.bookBtn}
            >
              Reserve Your Date
            </Link>

          </article>
        )) : (
          <p className={styles.emptyState}>
            Packages coming soon. Reach out directly to discuss your vision.
          </p>
        )}
      </section>

      {/* Bottom CTA */}
      <section className={styles.cta}>
        <p className={styles.ctaEyebrow}>Ready to begin?</p>
        <h2 className={styles.ctaHeading}>{"Reserve your date"}<br />{"before it's gone."}</h2>
        <p className={styles.ctaBody}>
          Dates fill quickly. Securing yours takes only a deposit.
        </p>
        <div className={styles.ctaActions}>
          <Link href="/book" className={styles.ctaBtn}>Book a Session</Link>
          <Link href="/contact" className={styles.ctaBtnSecondary}>Have questions?</Link>
        </div>
      </section>

    </main>
  )
}
