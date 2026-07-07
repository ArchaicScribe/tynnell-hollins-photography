import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import styles from './page.module.css'
import type { Photo } from '@/payload-types'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Client Words | Tynnell Hollins Photography',
  description: 'Kind words from couples, families, and portrait clients who have worked with Tynnell Hollins Photography.',
}

export default async function TestimonialsPage() {
  const payload = await getPayload({ config })
  const { docs: testimonials } = await payload.find({
    collection: 'testimonials',
    sort: 'displayOrder',
    depth: 1,
    limit: 200,
  })

  const reviewSchema = testimonials.length > 0 ? {
    '@context': 'https://schema.org',
    '@graph': testimonials.map(t => ({
      '@type': 'Review',
      reviewBody: t.quote,
      author: { '@type': 'Person', name: t.clientName },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      itemReviewed: {
        '@type': 'LocalBusiness',
        name: 'Tynnell Hollins Photography',
        url: 'https://tynnellhollinsphotography.com',
      },
    })),
  } : null

  return (
    <main className={styles.page}>
      {reviewSchema && <JsonLd data={reviewSchema} />}

      {/* Hero with handwritten script background */}
      <div className={styles.hero}>
        <div className={styles.scriptBg} aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={styles.scriptLine}>
              {`Every moment captured in light and shadow, a story told through the lens of love and laughter, hearts intertwined in the dance of forever, treasured memories woven into the fabric of time, whispered promises and stolen glances preserved`}
            </span>
          ))}
        </div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeading}>Their Words Tell It Best</h1>
          <p className={styles.heroSub}>
            From big days to small breaths, these words echo the real life inside each photo.
          </p>
        </div>
      </div>

      {/* Testimonials */}
      <div className={styles.list}>
        {testimonials.length > 0 ? (
          testimonials.map((t) => {
            const photo = t.photo && typeof t.photo === 'object' ? t.photo as Photo : null
            const photoUrl = photo?.sizes?.card?.url ?? photo?.sizes?.thumbnail?.url ?? photo?.url ?? null
            const photoWidth = photo?.sizes?.card?.width ?? photo?.sizes?.thumbnail?.width ?? photo?.width ?? null
            const photoHeight = photo?.sizes?.card?.height ?? photo?.sizes?.thumbnail?.height ?? photo?.height ?? null

            return (
              <article key={t.id} className={styles.item} aria-label={`Review from ${t.clientName}`}>
                {/* Text block */}
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

                {/* Photo (when set) */}
                {photoUrl && (
                  <div className={styles.photoWrap}>
                    {photoWidth && photoHeight ? (
                      <Image
                        src={photoUrl}
                        alt={`${t.clientName} session`}
                        width={photoWidth}
                        height={photoHeight}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className={styles.photo}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoUrl}
                        alt={`${t.clientName} session`}
                        className={styles.photo}
                        loading="lazy"
                      />
                    )}
                  </div>
                )}
              </article>
            )
          })
        ) : (
          <p className={styles.empty}>Kind words are on their way.</p>
        )}
      </div>

      {/* CTA */}
      <div className={styles.cta}>
        <p className={styles.ctaEyebrow}>Ready to create your story?</p>
        <h2 className={styles.ctaHeading}>Let&apos;s Work Together</h2>
        <Link href="/contact" className={styles.ctaBtn}>Book a Session</Link>
      </div>
    </main>
  )
}
