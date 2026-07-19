'use client'
import { useEffect, useState } from 'react'

export interface TypewriterTextProps {
  phrases: string[]
  speed?: number
  pause?: number
}

const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
}

// Character-by-character typing effect (TYN-337), cycling through multiple
// phrases. Respects both the sitewide "Enable animations" Design toggle
// (app/(site)/layout.tsx sets data-animations="off" on <html>) and the
// browser's prefers-reduced-motion - renders the first phrase statically
// immediately in either case, rather than forcing the effect.
export function TypewriterText({ phrases, speed = 60, pause = 1800 }: TypewriterTextProps) {
  const validPhrases = phrases.filter(Boolean)
  const [display, setDisplay] = useState('')
  const [disabled, setDisabled] = useState(true)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animationsOff = document.documentElement.dataset.animations === 'off'
    setDisabled(reduceMotion || animationsOff)
  }, [])

  useEffect(() => {
    if (disabled || validPhrases.length === 0) return
    let phraseIndex = 0
    let charIndex = 0
    let deleting = false
    let timer: ReturnType<typeof setTimeout>

    function tick() {
      const current = validPhrases[phraseIndex]
      if (!deleting) {
        charIndex++
        setDisplay(current.slice(0, charIndex))
        if (charIndex === current.length) {
          deleting = true
          timer = setTimeout(tick, pause)
          return
        }
      } else {
        charIndex--
        setDisplay(current.slice(0, charIndex))
        if (charIndex === 0) {
          deleting = false
          phraseIndex = (phraseIndex + 1) % validPhrases.length
        }
      }
      timer = setTimeout(tick, deleting ? speed / 2 : speed)
    }
    timer = setTimeout(tick, speed)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, speed, pause])

  if (validPhrases.length === 0) return null

  if (disabled) {
    return <>{validPhrases[0]}</>
  }

  return (
    <>
      <span aria-hidden="true">{display}</span>
      <span style={visuallyHidden}>{validPhrases.join(' ')}</span>
    </>
  )
}
