'use client'

import { useActiveOnScroll } from '@/app/hooks/useActiveOnScroll'
import type { TestimonialItem } from './TestimonialsList'
import styles from './PinnedTestimonials.module.css'

// Rising Roots "Kind words": a small label top left, one portrait pinned on the left
// (with a caption) that swaps as each quote scrolls into the middle, and large light
// quotes scrolling past on the right. With `onPhoto` (the block has a photo behind it)
// the text is light; otherwise it takes the page's ink. A testimonial without its own
// portrait keeps the last one seen, which is what makes "groups" share a photo; quotes before
// the first portrait show that first portrait, so the photo column is there from the start.
export default function PinnedTestimonials({
  testimonials,
  label,
  caption,
  onPhoto = false,
}: {
  testimonials: TestimonialItem[]
  label?: string
  caption?: string
  onPhoto?: boolean
}) {
  const { activeIndex, itemRef } = useActiveOnScroll(testimonials.length)

  // Start from the first portrait there is, so a first quote without one still has the photo
  // column from the first paint instead of the column popping in when the second quote scrolls up.
  let activePhoto: TestimonialItem | null = testimonials.find((t) => t.photoUrl) ?? null
  for (let i = 0; i <= activeIndex; i++) {
    if (testimonials[i]?.photoUrl) activePhoto = testimonials[i]
  }

  return (
    <div className={onPhoto ? `${styles.root} ${styles.onPhoto}` : styles.root}>
      {label?.trim() && <p className={styles.label}>{label}</p>}
      <div className={styles.layout}>
        {activePhoto?.photoUrl && (
          <div className={styles.photoCol}>
            <div className={styles.photoFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={activePhoto.id} src={activePhoto.photoUrl} alt={`${activePhoto.clientName} session`} className={styles.photo} loading="lazy" />
            </div>
            {caption?.trim() && <p className={styles.caption}>{caption}</p>}
          </div>
        )}
        <div className={styles.quoteCol}>
          {testimonials.map((t, i) => (
            <article key={t.id} ref={itemRef(i)} className={styles.item} aria-label={`Review from ${t.clientName}`}>
              <blockquote className={styles.quote}>
                <span aria-hidden="true">&ldquo;</span>
                {t.quote}
                <span aria-hidden="true">&rdquo;</span>
              </blockquote>
              <cite className={styles.name}>{t.clientName}</cite>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
