'use client'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'
import styles from './Hero.module.css'
import type { HeroSlide } from './Hero'

export default function SwiperSlides({ slides }: { slides: HeroSlide[] }) {
  return (
    <Swiper
      modules={[Autoplay, EffectFade]}
      effect="fade"
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      loop={true}
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
