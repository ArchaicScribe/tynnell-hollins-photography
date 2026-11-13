'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import {
  PARALLAX_RANGE,
  motionAllowed,
  parallaxProgress,
  parallaxTranslatePercent,
  type PhotoMovement,
} from '@/app/hooks/parallax'

// TYN-358: photo parallax for the page builder. Wrap an absolutely positioned
// photo (the child keeps its own `position: absolute; inset: 0` styling, so
// ScrollFadeImage works inside). With movement none or unset the children are
// returned untouched, so existing pages render exactly as before.
//
// Otherwise a clipped frame holds a layer made taller than the frame by twice
// the range; the layer is translated from +range to -range as the frame passes
// through the viewport, so the frame never shows a gap.

const pct = (n: number) => `${Math.round(n * 1000) / 1000}%`

export function ParallaxLayer({ level, children }: { level?: PhotoMovement; children: ReactNode }) {
  const range = level && level !== 'none' ? PARALLAX_RANGE[level] : 0
  const frameRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const frame = frameRef.current
    const layer = layerRef.current
    if (!range || !frame || !layer) return

    let scheduled = false
    let near = true
    let frameId = 0

    const update = () => {
      scheduled = false
      if (!motionAllowed(window, document)) {
        layer.style.transform = ''
        return
      }
      const progress = parallaxProgress(frame.getBoundingClientRect(), window.innerHeight)
      layer.style.transform = `translate3d(0, ${pct(parallaxTranslatePercent(progress, range))}, 0)`
    }
    const schedule = () => {
      if (!near || scheduled) return
      scheduled = true
      frameId = requestAnimationFrame(update)
    }

    // Only do work while the frame is close to the viewport. Without
    // IntersectionObserver it simply works all the time.
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
  }, [range])

  if (!range) return <>{children}</>

  return (
    <div ref={frameRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div
        ref={layerRef}
        data-parallax-layer
        style={{ position: 'absolute', left: 0, right: 0, top: pct(-range * 100), height: pct((1 + 2 * range) * 100), willChange: 'transform' }}
      >
        {children}
      </div>
    </div>
  )
}
