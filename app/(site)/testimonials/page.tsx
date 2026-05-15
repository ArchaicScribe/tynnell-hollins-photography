import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Client Love | Tynnell Hollins Photography',
  description: 'Kind words from couples, families, and portrait clients who have worked with Tynnell Hollins Photography.',
}

export default async function TestimonialsPage() {
  const payload = await getPayload({ config })
  const { docs: testimonials } = await payload.find({
    collection: 'testimonials',
    sort: 'displayOrder',
    depth: 0,
  })

  return (
    <main className={styles.page}>

      <div className={styles.header}>
        <p className={styles.eyebrow}>Kind Words</p>
        <h1 className={styles.heading}>Client Love</h1>
        <p className={styles.subheading}>
          Every session is built on trust. Here&apos;s what clients have to say.
        </p>
      </div>

      {testimonials.length > 0 ? (
        <div className={styles.grid}>
          {testimonials.map((t) => (
            <article key={t.id} className={styles.card}>
              <p className={styles.stars} aria-label="5 stars">★★★★★</p>
              <blockquote className={styles.quote}>&ldquo;{t.quote}&rdquo;</blockquote>
              <footer className={styles.footer}>
                <p className={styles.name}>{t.clientName}</p>
                {t.sessionType && (
                  <p className={styles.session}>{t.sessionType}</p>
                )}
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>More kind words coming soon.</p>
      )}

      <div className={styles.cta}>
        <p className={styles.ctaEyebrow}>Ready to create your story?</p>
        <h2 className={styles.ctaHeading}>Let&apos;s Work Together</h2>
        <Link href="/contact" className={styles.ctaBtn}>Book a Session</Link>
      </div>

    </main>
  )
}
