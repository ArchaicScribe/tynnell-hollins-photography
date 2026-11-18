'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motionAllowed } from '@/app/hooks/parallax'

// TYN-358: section content fades up once, the first time it scrolls into view.
//
// It renders visible, and only after hydration hides content that starts below
// the fold. Content already in view is never hidden, and visitors without
// JavaScript (or with reduced motion, or with the /design animations switch off)
// simply see everything.

type Phase = 'visible' | 'hidden' | 'revealed'

// Step 5: stronger than the first version (24px over 0.9s, easily missed), with
// the easing the Rising Roots reveals use (ease-out). The reference has no
// scroll-triggered text rise of its own, so this is deliberately a notch past it.
const RISE_PX = 48
const TRANSITION = 'opacity var(--motion-slow, 1s) var(--ease, ease-out), transform var(--motion-slow, 1s) var(--ease, ease-out)'
const SETTLE_MS = 1100 // a little longer than --motion-slow (1s)
// Start once the block is inside the screen (its top 12% of the viewport above
// the bottom edge) so the rise is seen, not spent off-screen at the very edge.
const ROOT_MARGIN = '0px 0px -12% 0px'

export function FadeUp({ enabled, children }: { enabled?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('visible')

  useEffect(() => {
    const el = ref.current
    // Every way out below shows the content: a block hidden earlier (the editor
    // switched the control Off, then On again while it was in view) would
    // otherwise keep its old 'hidden' phase with no observer left to reveal it.
    if (
      !enabled ||
      !el ||
      !motionAllowed(window, document) ||
      typeof IntersectionObserver === 'undefined' ||
      el.getBoundingClientRect().top < window.innerHeight
    ) {
      setPhase('visible')
      return
    }

    setPhase('hidden')
    const reveal = (entries: IntersectionObserverEntry[]) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setPhase('revealed')
        observers.forEach((o) => o.disconnect())
      }
    }
    // A short block at the very bottom of the page can never scroll up to the
    // inset line, so a second watcher reveals it once it is wholly on screen.
    const observers = [
      new IntersectionObserver(reveal, { rootMargin: ROOT_MARGIN }),
      new IntersectionObserver(reveal, { threshold: 1 }),
    ]
    observers.forEach((o) => o.observe(el))
    return () => observers.forEach((o) => o.disconnect())
  }, [enabled])

  // Once the fade has had time to finish, drop every inline style. A leftover
  // `transform: translateY(0)` would still make this wrapper the containing block
  // for position:fixed descendants (the category grid's lightbox), shrinking a
  // full-screen overlay to the size of the block.
  useEffect(() => {
    if (phase !== 'revealed') return
    const id = setTimeout(() => setPhase('visible'), SETTLE_MS)
    return () => clearTimeout(id)
  }, [phase])

  // Switched off after mount (the editor toggle): show everything at once.
  const style: React.CSSProperties = !enabled
    ? {}
    : phase === 'hidden'
      ? { opacity: 0, transform: `translateY(${RISE_PX}px)`, transition: TRANSITION }
      : phase === 'revealed'
        ? { opacity: 1, transform: 'translateY(0)', transition: TRANSITION }
        : {}

  return <div ref={ref} style={style} data-fade-up={enabled ? '' : undefined}>{children}</div>
}
