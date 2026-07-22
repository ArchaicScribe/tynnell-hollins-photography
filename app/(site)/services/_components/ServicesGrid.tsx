import Link from 'next/link'
import { slugifyServiceTitle } from '@/app/lib/slug'
import styles from './ServicesGrid.module.css'

export type ServiceItem = {
  id: string | number
  eyebrow?: string | null
  title: string
  price?: string | null
  description?: string | null
  features: string[]
  depositAmount?: number | null
}

// Extracted from the original services/page.tsx inline markup (unchanged
// behavior, including the empty state) so the same card grid can be reused
// by the LiveServices builder block (app/builder/puck.config.tsx) without
// duplicating markup.
export default function ServicesGrid({ services }: { services: ServiceItem[] }) {
  if (services.length === 0) {
    return (
      <section className={styles.cards} aria-label="Service packages">
        <div className={styles.emptyState}>
          <p className={styles.emptyEyebrow}>Coming Soon</p>
          <p className={styles.emptyText}>Packages are being finalised. Reach out directly to discuss your vision.</p>
          <Link href="/contact" className={styles.bookBtn}>Get in Touch</Link>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.cards} aria-label="Service packages">
      {services.map((service, i) => (
        <article key={service.id} className={styles.card}>
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

            {service.features.length > 0 && (
              <ul className={styles.featureList}>
                {service.features.map((item, fi) => (
                  <li key={fi} className={styles.featureItem}>
                    <span className={styles.featureDot} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.cardActions}>
              <Link
                href={`/book?package=${slugifyServiceTitle(service.title)}`}
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
      ))}
    </section>
  )
}
