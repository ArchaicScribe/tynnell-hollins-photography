'use client'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'
import styles from './Hero.module.css'

const slides = [
  { src: '/images/hero-1.jpg', alt: 'Wedding photography' },
  { src: '/images/hero-2.jpg', alt: 'Portrait photography' },
  { src: '/images/hero-3.jpg', alt: 'Family photography' },
]

export default function Hero() {
  return (
    <section className={styles.hero}>
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        className={styles.swiper}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.src} className={styles.slide}>
            <div
              className={styles.image}
              style={{ backgroundImage: `url(${slide.src})` }}
              role="img"
              aria-label={slide.alt}
            />
          </SwiperSlide>
        ))}
      </Swiper>
      <div className={styles.overlay}>
        <p className={styles.tagline}>Lost in the Moment, Found in Forever</p>
      </div>
    </section>
  )
}