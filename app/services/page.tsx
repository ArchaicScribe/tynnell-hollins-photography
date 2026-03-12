import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Services | Tynnell Hollins Photography',
  description: 'Photography packages for weddings, engagements, portraits, family sessions, maternity, and events in New Mexico.',
}

interface Service {
  eyebrow: string
  title: string
  description: string
  includes: string[]
  note?: string
}

const SERVICES: Service[] = [
  {
    eyebrow: 'Weddings',
    title: 'Your Wedding Day',
    description:
      'Full-day coverage that tells your complete story — from the quiet moments before the ceremony to the last dance of the night.',
    includes: [
      'Up to 8 hours of coverage',
      'Engagement session included',
      'Online gallery with print release',
      'Customizable timeline consultation',
    ],
  },
  {
    eyebrow: 'Engagements',
    title: 'Engagement Sessions',
    description:
      'A chance to celebrate where you are before the big day. Relaxed, intentional, and entirely yours.',
    includes: [
      '1-hour session',
      'Your choice of location',
      'Online gallery with print release',
      '30+ edited images delivered',
    ],
  },
  {
    eyebrow: 'Portraits',
    title: 'Portrait Sessions',
    description:
      'Whether it\'s a milestone, a headshot, or simply a moment worth keeping — every person deserves a photograph that feels like them.',
    includes: [
      '1-hour session',
      'One outfit change',
      'Online gallery with print release',
      '25+ edited images delivered',
    ],
  },
  {
    eyebrow: 'Family',
    title: 'Family Sessions',
    description:
      'The chaos, the love, the real. Family sessions are about capturing your people exactly as they are right now.',
    includes: [
      '1-hour session',
      'Up to 6 family members',
      'Online gallery with print release',
      '30+ edited images delivered',
    ],
    note: 'Additional family members welcome — ask about extended family rates.',
  },
  {
    eyebrow: 'Maternity',
    title: 'Maternity Sessions',
    description:
      'One of the most fleeting and profound seasons of life, documented with warmth and intention.',
    includes: [
      '1-hour session',
      'Wardrobe guidance provided',
      'Online gallery with print release',
      '25+ edited images delivered',
    ],
    note: 'Best scheduled between 28–34 weeks.',
  },
  {
    eyebrow: 'Events',
    title: 'Event Coverage',
    description:
      'Corporate events, birthday celebrations, quinceañeras, and more. If it matters to you, it matters to me.',
    includes: [
      'Flexible hourly coverage',
      'Candid and posed coverage',
      'Online gallery with print release',
      'Quick turnaround available',
    ],
    note: 'Contact for custom event quotes.',
  },
]

export default function ServicesPage() {
  return (
    <main className={styles.main}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Services & Packages</p>
        <h1 className={styles.heroHeading}>
          Every Story<br />Deserves to Be<br />Told
        </h1>
        <p className={styles.heroBody}>
          Each session is crafted to fit your life — not the other way around.
          Reach out and we&apos;ll find the right fit together.
        </p>
      </section>

      {/* ── Services Grid ─────────────────────────────────────── */}
      <section className={styles.grid}>
        {SERVICES.map((service) => (
          <article key={service.eyebrow} className={styles.card}>
            <p className={styles.cardEyebrow}>{service.eyebrow}</p>
            <h2 className={styles.cardTitle}>{service.title}</h2>
            <p className={styles.cardDesc}>{service.description}</p>
            <ul className={styles.includesList}>
              {service.includes.map((item) => (
                <li key={item} className={styles.includesItem}>
                  <span className={styles.dot} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            {service.note && (
              <p className={styles.cardNote}>{service.note}</p>
            )}
          </article>
        ))}
      </section>

      {/* ── Investment note ───────────────────────────────────── */}
      <section className={styles.investmentNote}>
        <p className={styles.investmentEyebrow}>Investment</p>
        <p className={styles.investmentBody}>
          Pricing is shared during your consultation so we can find the right
          package for your vision and budget. No hidden fees, no surprises.
        </p>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className={styles.cta}>
        <p className={styles.ctaEyebrow}>Ready to Book?</p>
        <h2 className={styles.ctaHeading}>
          Let&apos;s Start<br />Planning
        </h2>
        <p className={styles.ctaBody}>
          Fill out the inquiry form and I&apos;ll be in touch within 48 hours
          to talk through your session.
        </p>
        <Link href="/contact" className={styles.ctaBtn}>Send an Inquiry</Link>
      </section>

    </main>
  )
}
