'use client'
import { useEffect, useState, type CSSProperties } from 'react'

// TYN-355: auto-advancing crossfade slideshow - the freeform builder's
// ImageSlideshowElement, distinct from ImageCarouselElement (PhotoCarouselBlock
// + Swiper) by having no swipe/drag interaction at all, just a timer.
// TYN-347: also drives the Image element's optional photo rotation, which
// passes `imgStyle` so its opacity and focal point apply to every photo (a
// photo's own `objectPosition` wins), and `pauseForReducedMotion` because
// there the photos are a backdrop rather than content.

const FADE_MS = 800

export function ImageSlideshowBlock({
  images,
  intervalMs = 4000,
  alt = '',
  imgStyle,
  pauseForReducedMotion = false,
}: {
  images: { url: string; objectPosition?: string }[]
  intervalMs?: number
  alt?: string
  imgStyle?: CSSProperties
  pauseForReducedMotion?: boolean
}) {
  // `prev` is the photo that was just replaced. It stays solid underneath
  // while the new one fades in on top, so the page behind never shows
  // through mid-fade, then clears once the fade is over.
  const [slide, setSlide] = useState<{ index: number; prev: number | null }>({ index: 0, prev: null })

  useEffect(() => {
    if (images.length < 2) return
    if (pauseForReducedMotion && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setSlide((s) => ({ index: (s.index + 1) % images.length, prev: s.index })), intervalMs)
    return () => clearInterval(id)
  }, [images.length, intervalMs, pauseForReducedMotion])

  useEffect(() => {
    if (slide.prev === null) return
    const id = setTimeout(() => setSlide((s) => ({ ...s, prev: null })), FADE_MS)
    return () => clearTimeout(id)
  }, [slide])

  // Modulo keeps a valid photo on screen if photos are removed mid-rotation.
  const shown = slide.index % images.length
  const under = slide.prev === null ? null : slide.prev % images.length

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {images.map((img, i) => {
        const visible = i === shown || i === under
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={img.url}
            // The first photo carries the description and stays readable to
            // screen readers; the rest are interchangeable backdrop.
            alt={i === 0 ? alt : ''}
            aria-hidden={i === 0 ? undefined : true}
            fetchPriority={i === 0 ? undefined : 'low'}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              ...imgStyle,
              ...(img.objectPosition ? { objectPosition: img.objectPosition } : {}),
              zIndex: i === shown ? 2 : i === under ? 1 : 0,
              opacity: visible ? (imgStyle?.opacity ?? 1) : 0,
              transition: `opacity ${FADE_MS / 1000}s ease`,
            }}
          />
        )
      })}
    </div>
  )
}
