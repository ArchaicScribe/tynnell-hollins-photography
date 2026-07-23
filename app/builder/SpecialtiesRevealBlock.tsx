'use client'

import { useState } from 'react'

export type SpecialtyRevealItem = {
  heading?: string
  body?: string
  photo?: string
}

// TYN-345: click (or hover, for mouse users) a list item to crossfade a photo
// panel to match it. Puck-block version of app/(site)/about/SpecialtyReveal.tsx -
// that one is styled via the About page's own CSS module, which isn't usable
// here since this block also has to render identically in the Puck editor
// canvas; this uses the same inline-style convention as every other block in
// puck.config.tsx instead.
export function SpecialtiesRevealBlock({
  items, bodyColor, detailColor, bodyFont,
}: {
  items: SpecialtyRevealItem[]
  bodyColor: string
  detailColor: string
  bodyFont: string
}) {
  const valid = (items ?? []).filter((i) => i?.heading)
  const firstWithPhoto = valid.findIndex((i) => i.photo)
  const [activeIndex, setActiveIndex] = useState(firstWithPhoto === -1 ? 0 : firstWithPhoto)
  const active = valid[activeIndex]

  if (valid.length === 0) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
      <div style={{ position: 'relative', aspectRatio: '4 / 5', overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
        {active?.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={active.photo}
            src={active.photo}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'puckSpecialtyFade 0.5s ease' }}
          />
        )}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', alignSelf: 'center' }}>
        {valid.map((item, i) => (
          <li key={item.heading}>
            <button
              type="button"
              onClick={() => item.photo && setActiveIndex(i)}
              onMouseEnter={() => item.photo && setActiveIndex(i)}
              aria-pressed={activeIndex === i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem', width: '100%',
                background: 'none', border: 'none', padding: 0, margin: 0, textAlign: 'left', cursor: 'pointer',
              }}
            >
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: detailColor, flexShrink: 0, marginTop: '0.5em' }} aria-hidden="true" />
              <span style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontFamily: bodyFont, fontSize: '0.8rem', fontWeight: 300, color: bodyColor }}>{item.heading}</span>
                {item.body && (
                  <span style={{ fontFamily: bodyFont, fontSize: '0.7rem', fontWeight: 300, lineHeight: 1.6, color: detailColor }}>{item.body}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <style>{`@keyframes puckSpecialtyFade { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  )
}
