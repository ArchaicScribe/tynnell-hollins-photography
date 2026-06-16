import Link from 'next/link'
import { HeroSlideshow } from './HeroSlideshow'
import styles from './Hero.module.css'

export interface HeroSlide {
  id: string
  imageUrl: string | null
  alt?: string
  tagline?: string
}

interface Props {
  slides: HeroSlide[]
  defaultTagline?: string
}

const FALLBACK_TAGLINE = 'Lost in the Moment, Found in Forever'

export default function Hero({ slides, defaultTagline = FALLBACK_TAGLINE }: Props) {
  const validSlides = slides.filter(s => s.imageUrl)

  return (
    <section className={styles.hero}>
      <HeroSlideshow slides={validSlides} />
      <div className={styles.overlay}>
        <div className={styles.overlayContent}>
          <p className={styles.tagline}>
            {slides[0]?.tagline ?? defaultTagline}
          </p>
          <p className={styles.subline}>Weddings · Portraits · Families</p>
          <Link href="/book" className={styles.ctaBtn}>Book a Session</Link>
        </div>
      </div>
    </section>
  )
}
