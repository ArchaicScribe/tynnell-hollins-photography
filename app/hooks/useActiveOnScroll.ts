'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Which of a list of elements is currently in the middle band of the screen.
// Drives the "pinned photo that changes as you scroll" layouts: the sticky
// testimonials (TYN-354) and the Sticky Panels builder block. Starts at 0, so
// the first item's photo shows before anything has scrolled.
export function useActiveOnScroll(count: number) {
  const [activeIndex, setActiveIndex] = useState(0)
  const elements = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b))
        const idx = elements.current.indexOf(topMost.target as HTMLElement)
        if (idx !== -1) setActiveIndex(idx)
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
    )
    elements.current.slice(0, count).forEach((el) => {
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [count])

  const itemRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      elements.current[index] = el
    },
    [],
  )

  return { activeIndex, itemRef }
}
