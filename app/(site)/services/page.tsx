import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import styles from './page.module.css'

// Service packages change rarely - revalidate every 2 minutes
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

      {/* Hero */}
      <section className={styles.hero} aria-label="Services">
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroTextBox}>
            <p className={styles.eyebrow}>Services</p>
            <h1 className={styles.heroHeading}>{"Every Session,"}<br />{"Crafted for You"}</h1>
          </div>
          <div className={styles.heroDescBox}>
            <p className={styles.heroSub}>
              {"Packages designed to give you images you'll treasure for a lifetime. Choose the experience that fits your story."}
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.process} aria-label="How it works">
        <p className={styles.processEyebrow}>How It Works</p>
        <ol className={styles.steps}>
          <li className={styles.step}>
            <span className={styles.stepNum}>01</span>
            <h2 className={styles.stepHeading}>Connect</h2>
            <p className={styles.stepBody}>Fill out the inquiry form or send a message. We talk through your vision, your people, and what this session means to you.</p>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNum}>02</span>
            <h2 className={styles.stepHeading}>Plan Together</h2>
            <p className={styles.stepBody}>Choose your date and package. We walk through every detail so you feel relaxed and ready before we ever pick up a camera.</p>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNum}>03</span>
            <h2 className={styles.stepHeading}>Remember Forever</h2>
            <p className={styles.stepBody}>Your gallery arrives beautifully edited and ready to keep, share, and print. These images belong to you. Always.</p>
          </li>
        </ol>
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
              aria-label={`Book ${service.title} session`}
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
