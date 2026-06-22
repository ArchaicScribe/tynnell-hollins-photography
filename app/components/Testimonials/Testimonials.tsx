import Link from 'next/link'
import styles from './Testimonials.module.css'

export interface Testimonial {
  _id: string
  clientName: string
  quote: string
  sessionType?: string
}

interface Props {
  testimonials: Testimonial[]
}

const FALLBACK: Testimonial[] = [
  {
    _id: 'fallback-1',
    clientName: 'Jaqui C.',
    quote: 'Tynnell made me feel so confident and beautiful during my bridal session. She immediately put me at ease with her calm energy and gentle direction. The final gallery was everything I hoped for and more.',
    sessionType: 'Wedding',
  },
  {
    _id: 'fallback-2',
    clientName: 'Catalina S.',
    quote: "Tynnell has photographed every special moment in our lives. She made my daughter feel so confident and comfortable, and the photos truly captured her spirit.",
    sessionType: 'Portrait',
  },
  {
    _id: 'fallback-3',
    clientName: 'Martinez Family',
    quote: "Our at-home session with Tynnell was everything we didn't know we needed. She captured the love, softness, and newness of this season so effortlessly.",
    sessionType: 'Family',
  },
]

export default function Testimonials({ testimonials }: Props) {
  const items = testimonials.length > 0 ? testimonials : FALLBACK

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Kind Words</p>
        <h2 className={styles.heading}>What Clients Say</h2>
      </div>
      <div className={styles.grid}>
        {items.map((t) => (
          <figure key={t._id} className={styles.card}>
            <span className={styles.openQuote} aria-hidden="true">&ldquo;</span>
            <blockquote className={styles.quote}>{t.quote}</blockquote>
            <figcaption className={styles.author}>
              <span className={styles.name}>{t.clientName}</span>
              {t.sessionType && <span className={styles.session}>{t.sessionType} Session</span>}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className={styles.footer}>
        <Link href="/testimonials" className={styles.cta}>Read more kind words</Link>
      </div>
    </section>
  )
}
