'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import type { TestimonialItem } from './TestimonialsList'
import styles from './TestimonialSlider.module.css'

// Rising Roots "Kind words": one quote at a time with numbered controls
// (01, 02, 03). Only used with two or more testimonials; TestimonialsList
// falls back to the plain list below that, so a lone control never shows.
export default function TestimonialSlider({ testimonials }: { testimonials: TestimonialItem[] }) {
  const [index, setIndex] = useState(0)
  const controls = useRef<(HTMLButtonElement | null)[]>([])
  const count = testimonials.length
  const current = testimonials[Math.min(index, count - 1)]

  // The arrow keys move to the next control and take keyboard focus with them, so the
  // following press carries on from the new quote instead of from the one just left.
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, from: number) {
    let next: number
    if (e.key === 'ArrowRight') next = (from + 1) % count
    else if (e.key === 'ArrowLeft') next = (from - 1 + count) % count
    else return
    e.preventDefault()
    setIndex(next)
    controls.current[next]?.focus()
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
        {testimonials.map((t, i) => {
          const number = String(i + 1).padStart(2, '0')
          return (
            <button
              key={t.id}
              ref={(el) => {
                controls.current[i] = el
              }}
              type="button"
              className={styles.control}
              // The number alone means nothing to a screen reader; the name keeps it and adds whose quote this opens.
              aria-label={`Quote ${number}: ${t.clientName}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => setIndex(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {number}
            </button>
          )
        })}
      </div>
    </div>
  )
}
