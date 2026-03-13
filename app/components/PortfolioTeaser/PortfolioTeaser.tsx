import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import styles from './PortfolioTeaser.module.css'

export interface FeaturedPhoto {
  _id: string
  title: string
  alt: string
  image: { asset: { _ref: string } }
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
          <div
            key={photo?._id ?? i}
            className={styles.card}
            style={{ '--rotation': `${TAPE_ANGLES[i]}deg` } as React.CSSProperties}
          >
            <div className={styles.tape} />
            <div className={styles.imageSlot}>
              {photo ? (
                <Image
                  src={urlFor(photo.image).width(600).height(750).quality(85).url()}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={styles.photo}
                />
              ) : (
                <span className={styles.placeholderLabel}>{PLACEHOLDERS[i]}</span>
              )}
            </div>
            <div className={styles.caption}>{photo?.title ?? PLACEHOLDERS[i]}</div>
          </div>
        ))}
      </div>
      <div className={styles.cta}>
        <Link href="/portfolio" className={styles.ctaButton}>View All Work</Link>
      </div>
    </section>
  )
}