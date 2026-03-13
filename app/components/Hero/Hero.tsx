'use client'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'
import { urlFor } from '@/sanity/lib/image'
import styles from './Hero.module.css'

export interface HeroSlide {
  _id: string
  image: { asset: { _ref: string } }
  alt: string
  tagline?: string
}

interface Props {
  slides: HeroSlide[]
  defaultTagline?: string
}

const FALLBACK_TAGLINE = 'Lost in the Moment, Found in Forever'

export default function Hero({ slides, defaultTagline = FALLBACK_TAGLINE }: Props) {
  const hasSlides = slides.length > 0

  return (
    <section className={styles.hero}>
      {hasSlides ? (
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={true}
          className={styles.swiper}
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide._id} className={styles.slide}>
              <div
                className={styles.image}
                style={{
                  backgroundImage: `url(${urlFor(slide.image).width(1920).quality(85).url()})`,
                }}
                role="img"
                aria-label={slide.alt}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className={styles.swiper} />
      )}
      <div className={styles.overlay}>
        <p className={styles.tagline}>
          {slides[0]?.tagline ?? defaultTagline}
        </p>
      </div>
    </section>
  )
}