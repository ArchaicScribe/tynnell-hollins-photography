'use client'

import { useState, type KeyboardEvent } from 'react'
import type { TestimonialItem } from './TestimonialsList'
import styles from './TestimonialSlider.module.css'

// Rising Roots "Kind words": one quote at a time with numbered controls
// (01, 02, 03). Only used with two or more testimonials; TestimonialsList
// falls back to the plain list below that, so a lone control never shows.
export default function TestimonialSlider({ testimonials }: { testimonials: TestimonialItem[] }) {
  const [index, setIndex] = useState(0)
  const count = testimonials.length
  const current = testimonials[Math.min(index, count - 1)]

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % count)
    else if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count)
    else return
    e.preventDefault()
  }

  return (
    <div className={styles.slider}>
      <div className={styles.stage} aria-live="polite">
        <figure key={current.id} className={styles.slide}>
          <blockquote className={styles.quote}>
            <span aria-hidden="true">&ldquo;</span>
            {current.quote}
            <span aria-hidden="true">&rdquo;</span>
          </blockquote>
          <figcaption className={styles.name}>{current.clientName}</figcaption>
        </figure>
      </div>
      <div className={styles.controls}>
        {testimonials.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className={styles.control}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => setIndex(i)}
            onKeyDown={onKeyDown}
          >
            {String(i + 1).padStart(2, '0')}
          </button>
        ))}
      </div>
    </div>
  )
}
