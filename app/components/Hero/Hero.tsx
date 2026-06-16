import Link from 'next/link'
import dynamic from 'next/dynamic'
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

const SwiperSlides = dynamic(() => import('./SwiperSlides'), { ssr: false })

export default function Hero({ slides, defaultTagline = FALLBACK_TAGLINE }: Props) {
  const validSlides = slides.filter(s => s.imageUrl)

  return (
    <section className={styles.hero}>
      {validSlides.length > 1 ? (
        <SwiperSlides slides={validSlides} />
      ) : validSlides.length === 1 ? (
        <div className={styles.swiper}>
          <div
            className={styles.image}
            style={{ backgroundImage: `url(${validSlides[0].imageUrl})` }}
            role="img"
            aria-label={validSlides[0].alt ?? ''}
          />
        </div>
      ) : (
        <div className={styles.swiper} />
      )}
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
