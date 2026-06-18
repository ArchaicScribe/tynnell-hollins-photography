'use client'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'
import styles from './Hero.module.css'
import type { HeroSlide } from './Hero'

export default function SwiperSlides({ slides }: { slides: HeroSlide[] }) {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <Swiper
      modules={[Autoplay, EffectFade]}
      effect="fade"
      autoplay={reduceMotion ? false : { delay: 5000, disableOnInteraction: false }}
      loop={!reduceMotion}
      className={styles.swiper}
    >
      {slides.map((slide) => (
        <SwiperSlide key={slide.id} className={styles.slide}>
          <div
            className={styles.image}
            style={{ backgroundImage: `url(${slide.imageUrl})` }}
            role="img"
            aria-label={slide.alt ?? ''}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
