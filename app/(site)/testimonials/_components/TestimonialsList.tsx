'use client'

import { useEffect, useRef, useState } from 'react'
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

function TestimonialPhoto({ photoUrl, photoWidth, photoHeight, clientName }: {
  photoUrl: string
  photoWidth?: number | null
  photoHeight?: number | null
  clientName: string
}) {
  return photoWidth && photoHeight ? (
    <Image
      src={photoUrl}
      alt={`${clientName} session`}
      width={photoWidth}
      height={photoHeight}
      sizes="(max-width: 768px) 100vw, 50vw"
      quality={90}
      className={styles.photo}
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt={`${clientName} session`} className={styles.photo} loading="lazy" />
  )
}

// TYN-354: the reference site shows one photo alongside the quotes, and the
// photo changes to a different couple's photo as you scroll through the next
// group of testimonials - reusing the existing per-testimonial `photo` field
// (collections/Testimonials.ts) rather than adding a new grouping concept.
// Testimonials without their own photo just keep whichever photo was last
// seen, which is what naturally produces "groups" sharing one photo.
function StickyScrollTestimonials({ testimonials }: { testimonials: TestimonialItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const itemRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b))
        const idx = itemRefs.current.findIndex((el) => el === topMost.target)
        if (idx !== -1) setActiveIndex(idx)
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    )
    itemRefs.current.forEach((el) => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [testimonials.length])

  // Carry the nearest-preceding photo forward so a testimonial without its
  // own photo doesn't blank the panel out mid-group.
  let lastPhoto: TestimonialItem | null = null
  const activePhoto = (() => {
    for (let i = 0; i <= activeIndex; i++) {
      if (testimonials[i]?.photoUrl) lastPhoto = testimonials[i]
    }
    return lastPhoto
  })()

  return (
    <div className={styles.stickyLayout}>
      <div className={styles.stickyPhotoCol}>
        <div className={styles.stickyPhotoWrap}>
          {activePhoto?.photoUrl && (
            <TestimonialPhoto
              key={activePhoto.id}
              photoUrl={activePhoto.photoUrl}
              photoWidth={activePhoto.photoWidth}
              photoHeight={activePhoto.photoHeight}
              clientName={activePhoto.clientName}
            />
          )}
        </div>
      </div>
      <div className={styles.stickyQuoteCol}>
        {testimonials.map((t, i) => (
          <article
            key={t.id}
            ref={(el) => { itemRefs.current[i] = el }}
            className={styles.stickyItem}
            aria-label={`Review from ${t.clientName}`}
          >
            {t.sessionType && <p className={styles.badge}>{t.sessionType} Testimonial</p>}
            <cite className={styles.clientName}>{t.clientName}</cite>
            <blockquote className={styles.quote}>
              <span className={styles.quoteOpen} aria-hidden="true">&ldquo;</span>
              {t.quote}
              <span className={styles.quoteClose} aria-hidden="true">&rdquo;</span>
            </blockquote>
          </article>
        ))}
      </div>
    </div>
  )
}

// Extracted from the original testimonials/page.tsx inline markup (unchanged
// behavior, including the empty state) so the same list can be reused by the
// LiveTestimonials builder block (app/builder/puck.config.tsx) without
// duplicating markup. `stickyPhotoScroll` is an opt-in layout (TYN-354/338
// style-exposure convention) - default stays the original per-item layout.
export default function TestimonialsList({ testimonials, stickyPhotoScroll = false }: { testimonials: TestimonialItem[]; stickyPhotoScroll?: boolean }) {
  if (testimonials.length === 0) {
    return <p className={styles.empty}>Kind words are on their way.</p>
  }

  if (stickyPhotoScroll) {
    return <StickyScrollTestimonials testimonials={testimonials} />
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
              <TestimonialPhoto photoUrl={t.photoUrl} photoWidth={t.photoWidth} photoHeight={t.photoHeight} clientName={t.clientName} />
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
