'use client'

import { useState } from 'react'
import styles from './page.module.css'

export type SpecialtyItem = {
  heading: string
  body?: string
  photoUrl?: string | null
}

// TYN-345: clicking (or hovering, for mouse users) a session-type item
// transitions the panel to a matching photo. Keyboard/touch users get the
// same result via click, since hover isn't reliably available to them.
export default function SpecialtyReveal({ items }: { items: SpecialtyItem[] }) {
  const firstWithPhoto = items.findIndex((i) => i.photoUrl)
  const [activeIndex, setActiveIndex] = useState(firstWithPhoto === -1 ? 0 : firstWithPhoto)
  const active = items[activeIndex]

  return (
    <>
      <div className={styles.specialtyPhotoPanel} aria-hidden={!active?.photoUrl}>
        {active?.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={active.photoUrl} src={active.photoUrl} alt="" className={styles.specialtyPhoto} />
        )}
      </div>
      <ul className={styles.specialtyList}>
        {items.map((item, i) => (
          <li key={item.heading} className={styles.specialtyItem}>
            <button
              type="button"
              className={styles.specialtyButton}
              onClick={() => item.photoUrl && setActiveIndex(i)}
              onMouseEnter={() => item.photoUrl && setActiveIndex(i)}
              aria-pressed={activeIndex === i}
            >
              <span className={styles.specialtyDot} aria-hidden="true" />
              <span className={styles.specialtyContent}>
                <span className={styles.specialtyHeading}>{item.heading}</span>
                {item.body && (
                  <span className={styles.specialtyBody}>{item.body}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
