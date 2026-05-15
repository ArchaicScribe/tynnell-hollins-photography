import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Services | Tynnell Hollins Photography',
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
                {service.features.map((item, i) => (
                  <li key={i} className={styles.featureItem}>
                    <span className={styles.featureDash} aria-hidden="true">{"—"}</span>
                    {item.feature}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/contact" className={styles.bookBtn}>
              Book This Session
            </Link>
          </article>
        )) : (
          <p className={styles.emptyState}>
            Packages coming soon — reach out directly to discuss your vision.
          </p>
        )}
      </section>

      {/* Bottom CTA */}
      <section className={styles.cta}>
        <p className={styles.ctaText}>Not sure which package is right for you?</p>
        <Link href="/contact" className={styles.ctaBtn}>Get in Touch</Link>
      </section>

    </main>
  )
}
