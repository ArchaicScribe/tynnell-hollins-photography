'use client'
import { useEffect, useState } from 'react'

// TYN-355: auto-advancing crossfade slideshow - the freeform builder's
// ImageSlideshowElement, distinct from ImageCarouselElement (PhotoCarouselBlock
// + Swiper) by having no swipe/drag interaction at all, just a timer.
export function ImageSlideshowBlock({ images, intervalMs = 4000 }: { images: { url: string }[]; intervalMs?: number }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), intervalMs)
    return () => clearInterval(id)
  }, [images.length, intervalMs])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={img.url}
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: i === index ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />
      ))}
    </div>
  )
}
