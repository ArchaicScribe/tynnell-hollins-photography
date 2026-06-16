'use client'
import dynamic from 'next/dynamic'
import type { HeroSlide } from './Hero'
import styles from './Hero.module.css'

// SwiperSlides is only needed for 2+ slides. next/dynamic with ssr:false
// code-splits it so the ~50KB Swiper bundle is never loaded for single-slide.
const SwiperSlides = dynamic(() => import('./SwiperSlides'), { ssr: false })

export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  if (slides.length > 1) return <SwiperSlides slides={slides} />
  if (slides.length === 1) {
    return (
      <div className={styles.swiper}>
        <div
          className={styles.image}
          style={{ backgroundImage: `url(${slides[0].imageUrl})` }}
          role="img"
          aria-label={slides[0].alt ?? ''}
        />
      </div>
    )
  }
  return <div className={styles.swiper} />
}
