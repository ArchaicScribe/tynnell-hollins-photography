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
    quote: 'Tynnell made me feel so confident and beautiful during my bridal session. I was a little nervous going in, but she immediately put me at ease with her calm energy and gentle direction. The final gallery was everything I hoped for and more.',
    sessionType: 'Wedding',
  },
  {
    _id: 'fallback-2',
    clientName: 'Catalina S.',
    quote: "Tynnell has photographed every special moment in our lives, so of course we trusted her with my daughter's senior session. She made her feel so confident and comfortable, and the photos truly captured her spirit.",
    sessionType: 'Portrait',
  },
  {
    _id: 'fallback-3',
    clientName: 'Martinez Family',
    quote: "Our at-home session with Tynnell was everything we didn't know we needed. She captured the love, softness, and newness of this season so effortlessly, and all in the comfort of our own space.",
    sessionType: 'Family',
  },
]

export default function Testimonials({ testimonials }: Props) {
  const items = testimonials.length > 0 ? testimonials : FALLBACK

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>KIND WORDS</p>
        <h2 className={styles.heading}>Client Testimonials</h2>
      </div>
      <div className={styles.grid}>
        {items.map((t) => (
          <figure key={t._id} className={styles.card}>
            <div className={styles.stars} aria-label="5 out of 5 stars" role="img">
              ★★★★★
            </div>
            <hr className={styles.divider} />
            <figcaption className={styles.name}>{t.clientName}</figcaption>
            <hr className={styles.divider} />
            <blockquote className={styles.quote}>{t.quote}</blockquote>
          </figure>
        ))}
      </div>
    </section>
  )
}
