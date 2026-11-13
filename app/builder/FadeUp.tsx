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

const TRANSITION = 'opacity 0.9s ease, transform 0.9s ease'
const SETTLE_MS = 1000 // a little longer than the 0.9s transition

export function FadeUp({ enabled, children }: { enabled?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('visible')

  useEffect(() => {
    const el = ref.current
    if (!enabled || !el || !motionAllowed(window, document)) return
    if (typeof IntersectionObserver === 'undefined') return
    if (el.getBoundingClientRect().top < window.innerHeight) return

    setPhase('hidden')
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setPhase('revealed')
        observer.disconnect()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
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
      ? { opacity: 0, transform: 'translateY(24px)', transition: TRANSITION }
      : phase === 'revealed'
        ? { opacity: 1, transform: 'translateY(0)', transition: TRANSITION }
        : {}

  return <div ref={ref} style={style} data-fade-up={enabled ? '' : undefined}>{children}</div>
}
