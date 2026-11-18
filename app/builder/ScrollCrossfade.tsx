'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import { motionAllowed, parallaxProgress } from '@/app/hooks/parallax'
import { crossfadeLayerOpacities } from '@/app/hooks/crossfade'

// Step 5: the Rising Roots signature effect. Photos are stacked inside one frame
// and, as the frame scrolls up through the viewport, each fades in over the one
// beneath it. Fill a positioned frame (it is `position: absolute; inset: 0`).
//
// It renders the first photo solid and the rest hidden, so with no JavaScript, with
// reduced motion, or with the /design animations switch off, visitors simply see
// the first photo. Opacities are written straight to the elements on scroll, not
// through React state, so scrolling never re-renders.

export function ScrollCrossfade({
  images,
  alt = '',
  imgStyle,
}: {
  images: { url: string }[]
  alt?: string
  imgStyle?: CSSProperties
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const count = images.length

  useEffect(() => {
    const frame = frameRef.current
    if (!frame || count < 2) return
    let scheduled = false
    let near = true
    let frameId = 0

    const update = () => {
      scheduled = false
      // Looked up on every frame, not once: in the editor a photo can be replaced
      // without the count changing, which mounts a new <img> the effect never saw.
      const layers = frame.querySelectorAll<HTMLElement>('[data-crossfade-layer]')
      const opacities = motionAllowed(window, document)
        ? crossfadeLayerOpacities(parallaxProgress(frame.getBoundingClientRect(), window.innerHeight), count)
        : crossfadeLayerOpacities(0, count)
      layers.forEach((layer, i) => {
        layer.style.opacity = String(opacities[i] ?? 0)
      })
    }
    const schedule = () => {
      if (!near || scheduled) return
      scheduled = true
      frameId = requestAnimationFrame(update)
    }

    // Only work while the frame is near the screen; without IntersectionObserver
    // it simply works all the time.
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              near = entry.isIntersecting
              if (near) schedule()
            },
            { rootMargin: '200px 0px' },
          )
    observer?.observe(frame)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()

    return () => {
      if (scheduled) cancelAnimationFrame(frameId)
      observer?.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [count])

  if (count === 0) return null

  return (
    <div ref={frameRef} data-crossfade style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${i}-${img.url}`}
          data-crossfade-layer
          src={img.url}
          // The first photo carries the description; the rest are interchangeable.
          alt={i === 0 ? alt : ''}
          aria-hidden={i === 0 ? undefined : true}
          fetchPriority={i === 0 ? undefined : 'low'}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            ...imgStyle,
            opacity: i === 0 ? 1 : 0,
          }}
        />
      ))}
    </div>
  )
}
