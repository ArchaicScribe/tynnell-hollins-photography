'use client'
import dynamic from 'next/dynamic'
import type { PhotoCarouselImage } from './PhotoCarouselSwiper'

// Code-splits Swiper (~50KB) out of pages that don't use this block, same
// pattern as the homepage Hero's HeroSlideshow/SwiperSlides.
const PhotoCarouselSwiper = dynamic(() => import('./PhotoCarouselSwiper'), { ssr: false })

export function PhotoCarouselBlock({ images }: { images: PhotoCarouselImage[] }) {
  if (images.length === 0) return null
  return <PhotoCarouselSwiper images={images} />
}
