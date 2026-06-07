import Link from 'next/link'
import { ProtectedImage } from '@/app/components/ProtectedImage/ProtectedImage'
import styles from './PortfolioTeaser.module.css'

export interface FeaturedPhoto {
  id: string
  title?: string | null
  alt?: string | null
  imageUrl: string | null
  category?: string
}

interface Props {
  photos: FeaturedPhoto[]
}

const TAPE_ANGLES = [-2, 1.5, -1, 2.5, -1.8, 1]
const PLACEHOLDERS = [
  'Wedding moment', 'Portrait session', 'Family photography',
  'Engagement shoot', 'Graduation portrait', 'Couples session',
]
const CATEGORY_HREFS = [
  '/portfolio?category=weddings',
  '/portfolio?category=portraits',
  '/portfolio?category=families',
  '/portfolio?category=couples',
  '/portfolio?category=portraits',
  '/portfolio?category=couples',
]

export default function PortfolioTeaser({ photos }: Props) {
  const slots = Array.from({ length: 6 }, (_, i) => photos[i] ?? null)

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>A Few Favorites</h2>
        <p className={styles.subheading}>Every frame tells a story</p>
      </div>
      <div className={styles.grid}>
        {slots.map((photo, i) => (
          <Link
            key={photo?.id ?? i}
            href={CATEGORY_HREFS[i]}
            className={styles.card}
            style={{ '--rotation': `${TAPE_ANGLES[i]}deg` } as React.CSSProperties}
            aria-label={`View ${PLACEHOLDERS[i]} gallery`}
          >
            <div className={styles.tape} />
            <div className={styles.imageSlot}>
              {photo?.imageUrl ? (
                <ProtectedImage
                  src={photo.imageUrl}
                  alt={photo.alt ?? photo.title ?? ''}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={styles.photo}
                />
              ) : (
                <span className={styles.placeholderLabel}>{PLACEHOLDERS[i]}</span>
              )}
            </div>
            <div className={styles.caption}>{photo?.title ?? PLACEHOLDERS[i]}</div>
          </Link>
        ))}
      </div>
      <div className={styles.cta}>
        <Link href="/portfolio" className={styles.ctaButton}>View All Work</Link>
      </div>
    </section>
  )
}
