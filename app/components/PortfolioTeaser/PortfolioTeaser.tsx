'use client'
import Link from 'next/link'
import styles from './PortfolioTeaser.module.css'

const placeholders = [
  { id: 1, alt: 'Wedding moment' },
  { id: 2, alt: 'Portrait session' },
  { id: 3, alt: 'Family photography' },
  { id: 4, alt: 'Engagement shoot' },
  { id: 5, alt: 'Graduation portrait' },
  { id: 6, alt: 'Sports photography' },
]

const tapeAngles = [-2, 1.5, -1, 2.5, -1.8, 1]

export default function PortfolioTeaser() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>A Few Favorites</h2>
        <p className={styles.subheading}>Every frame tells a story</p>
      </div>
      <div className={styles.grid}>
        {placeholders.map((item, i) => (
          <div
            key={item.id}
            className={styles.card}
            style={{ '--rotation': `${tapeAngles[i]}deg` } as React.CSSProperties}
          >
            <div className={styles.tape} />
            <div className={styles.imageSlot} role="img" aria-label={item.alt}>
              <span className={styles.placeholderLabel}>{item.alt}</span>
            </div>
            <div className={styles.caption}>{item.alt}</div>
          </div>
        ))}
      </div>
      <div className={styles.cta}>
        <Link href="/portfolio" className={styles.ctaButton}>
          View All Work
        </Link>
      </div>
    </section>
  )
}