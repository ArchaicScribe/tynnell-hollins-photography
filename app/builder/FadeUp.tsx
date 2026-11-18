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
// Staggered items start 120ms apart, up to 7 steps (the CSS caps the index), so
// the section must stay marked until the last of them has finished.
const STAGGER_TAIL_MS = 7 * 120
// Start once the block is inside the screen (its top 12% of the viewport above
// the bottom edge) so the rise is seen, not spent off-screen at the very edge.
const ROOT_MARGIN = '0px 0px -12% 0px'

// With `stagger` the wrapper itself never fades: it only publishes its phase as
// data-fade-phase, and items marked pk-stagger (see STAGGER_CSS in puck.config)
// rise one after another, each delayed by its own --i. Without it the whole
// block rises together, as before.
export function FadeUp({ enabled, stagger, children }: { enabled?: boolean; stagger?: boolean; children: ReactNode }) {
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
    const id = setTimeout(() => setPhase('visible'), stagger ? SETTLE_MS + STAGGER_TAIL_MS : SETTLE_MS)
    return () => clearTimeout(id)
  }, [phase, stagger])

  // Switched off after mount (the editor toggle): show everything at once.
  const style: React.CSSProperties = !enabled || stagger
    ? {}
    : phase === 'hidden'
      ? { opacity: 0, transform: `translateY(${RISE_PX}px)`, transition: TRANSITION }
      : phase === 'revealed'
        ? { opacity: 1, transform: 'translateY(0)', transition: TRANSITION }
        : {}

  const staggerPhase = enabled && stagger && phase !== 'visible' ? phase : undefined
  return <div ref={ref} style={style} data-fade-up={enabled ? '' : undefined} data-fade-phase={staggerPhase}>{children}</div>
}
