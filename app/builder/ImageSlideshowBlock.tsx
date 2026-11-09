'use client'
import { useEffect, useState, type CSSProperties } from 'react'

// TYN-355: auto-advancing crossfade slideshow - the freeform builder's
// ImageSlideshowElement, distinct from ImageCarouselElement (PhotoCarouselBlock
// + Swiper) by having no swipe/drag interaction at all, just a timer.
// TYN-347: also drives the Image element's optional photo rotation, which
// passes `imgStyle` so its focal point and opacity apply to every photo.
// Visitors who ask their device to reduce motion stay on the first photo.
export function ImageSlideshowBlock({
  images,
  intervalMs = 4000,
  alt = '',
  imgStyle,
}: {
  images: { url: string }[]
  intervalMs?: number
  alt?: string
  imgStyle?: CSSProperties
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
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
          alt={i === 0 ? alt : ''}
          aria-hidden={i === index ? undefined : true}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            ...imgStyle,
            opacity: i === index ? (imgStyle?.opacity ?? 1) : 0,
            transition: 'opacity 0.8s ease',
          }}
        />
      ))}
    </div>
  )
}
