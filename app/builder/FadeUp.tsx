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

export function FadeUp({ enabled, children }: { enabled?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('visible')

  useEffect(() => {
    const el = ref.current
    if (!enabled || !el || !motionAllowed(window, document)) return
    if (typeof IntersectionObserver === 'undefined') return
    if (el.getBoundingClientRect().top < window.innerHeight) return

    setPhase('hidden')
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setPhase('revealed')
        observer.disconnect()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled])

  const style: React.CSSProperties =
    phase === 'hidden'
      ? { opacity: 0, transform: 'translateY(24px)', transition: TRANSITION }
      : phase === 'revealed'
        ? { opacity: 1, transform: 'translateY(0)', transition: TRANSITION }
        : {}

  return <div ref={ref} style={style} data-fade-up={enabled ? '' : undefined}>{children}</div>
}
