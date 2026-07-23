import Image from 'next/image'
import styles from './TestimonialsList.module.css'

export type TestimonialItem = {
  id: string | number
  sessionType?: string | null
  clientName: string
  quote: string
  photoUrl?: string | null
  photoWidth?: number | null
  photoHeight?: number | null
}

// Extracted from the original testimonials/page.tsx inline markup (unchanged
// behavior, including the empty state) so the same list can be reused by the
// LiveTestimonials builder block (app/builder/puck.config.tsx) without
// duplicating markup.
export default function TestimonialsList({ testimonials }: { testimonials: TestimonialItem[] }) {
  if (testimonials.length === 0) {
    return <p className={styles.empty}>Kind words are on their way.</p>
  }

  return (
    <div className={styles.list}>
      {testimonials.map((t) => (
        <article key={t.id} className={styles.item} aria-label={`Review from ${t.clientName}`}>
          <div className={styles.textBlock}>
            {t.sessionType && (
              <p className={styles.badge}>{t.sessionType} Testimonial</p>
            )}
            <cite className={styles.clientName}>{t.clientName}</cite>
            <blockquote className={styles.quote}>
              <span className={styles.quoteOpen} aria-hidden="true">&ldquo;</span>
              {t.quote}
              <span className={styles.quoteClose} aria-hidden="true">&rdquo;</span>
            </blockquote>
          </div>

          {t.photoUrl && (
            <div className={styles.photoWrap}>
              {t.photoWidth && t.photoHeight ? (
                <Image
                  src={t.photoUrl}
                  alt={`${t.clientName} session`}
                  width={t.photoWidth}
                  height={t.photoHeight}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={90}
                  className={styles.photo}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.photoUrl}
                  alt={`${t.clientName} session`}
                  className={styles.photo}
                  loading="lazy"
                />
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
