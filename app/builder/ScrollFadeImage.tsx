'use client'

import { useEffect, useRef, useState } from 'react'

// TYN-353: reusable scroll-into-view effect - a photo starts desaturated and
// faded, then transitions to full color once it scrolls into the viewport.
// A single shared component so every block's background photo (via Section)
// gets this for free instead of each block reimplementing it. IntersectionObserver
// instead of a CSS-only approach because Safari/Firefox don't yet support
// scroll-driven animations (animation-timeline: view()) broadly enough to rely on.
export function ScrollFadeImage({ src, alt, style }: { src: string; alt?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLImageElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt ?? ''}
      style={{
        ...style,
        filter: visible ? 'grayscale(0)' : 'grayscale(1)',
        opacity: visible ? 1 : 0.55,
        transition: 'filter 1.2s ease, opacity 1.2s ease',
      }}
    />
  )
}
