'use client'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'

export interface PhotoCarouselImage {
  url: string
}

// Overlapping/staggered horizontal photo carousel (TYN-306), built on Swiper
// (already a dependency for the homepage Hero slideshow). Negative
// spaceBetween pulls adjacent slides into an overlap; breakpoints scale the
// effect back on narrow screens since the overlap was requested for desktop.
export default function PhotoCarouselSwiper({ images }: { images: PhotoCarouselImage[] }) {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <Swiper
      modules={[Autoplay]}
      slidesPerView={1}
      spaceBetween={12}
      centeredSlides
      autoplay={reduceMotion ? false : { delay: 4000, disableOnInteraction: false }}
      loop={!reduceMotion && images.length > 4}
      breakpoints={{
        640: { slidesPerView: 2.2, spaceBetween: -60 },
        1024: { slidesPerView: 3.2, spaceBetween: -90 },
      }}
      style={{ padding: '2.5rem 0' }}
    >
      {images.map((img, i) => (
        <SwiperSlide key={i}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt=""
            style={{ width: '100%', aspectRatio: '4 / 5', objectFit: 'cover', boxShadow: '0 14px 32px rgba(0,0,0,0.45)' }}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
