import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/lib/live'
import { servicesQuery } from '@/sanity/queries'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Services | Tynnell Hollins Photography',
  description: "Photography packages for weddings, portraits, families, couples, and brands. View pricing and what's included.",
}

type Service = {
  _id: string
  eyebrow?: string
  title: string
  description?: string
  features?: string[]
  price?: string
}

export default async function ServicesPage() {
  const { data: services } = await sanityFetch({ query: servicesQuery })

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
        {services && services.length > 0 ? (services as Service[]).map((service) => (
          <article key={service._id} className={styles.card}>
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
                {service.features.map((feature, i) => (
                  <li key={i} className={styles.featureItem}>
                    <span className={styles.featureDash} aria-hidden="true">{"—"}</span>
                    {feature}
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
