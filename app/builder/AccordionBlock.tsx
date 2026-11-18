'use client'
import { useId, useState } from 'react'
import { staggerItem } from './stagger'

export interface AccordionItem {
  title: string
  body: string
}

const HEADING_FONT = "var(--font-heading, Archivo, sans-serif)"
const BODY_FONT = "var(--font-body, 'Roboto Mono', monospace)"

// Collapsible title/body rows (TYN-336) - only one section open at a time,
// matching the common FAQ-accordion convention.
export function AccordionBlock({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const baseId = useId()

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {items.map((item, i) => {
        const isOpen = openIndex === i
        const panelId = `${baseId}-panel-${i}`
        return (
          <div key={i} {...staggerItem(i + 1, { borderBottom: '1px solid rgba(155,154,154,0.18)' })}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '1.1rem 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: HEADING_FONT,
                fontSize: '1rem',
                color: 'var(--color-heading, #D6D1CE)',
              }}
            >
              <span>{item.title}</span>
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  color: 'var(--color-detail, #9B9A9A)',
                  transform: isOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform var(--motion-fast, 0.2s) var(--ease, ease-out)',
                }}
              >
                &#9660;
              </span>
            </button>
            {/* The answer eases open: a one-row grid grows from 0fr to 1fr, so no height
                is measured. While shut it is also visibility:hidden (after the collapse
                has finished) so keyboard and screen readers skip it. Reduced motion and
                the /design animations switch cut the transition to nothing globally. */}
            <div
              id={panelId}
              style={{
                display: 'grid',
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                visibility: isOpen ? 'visible' : 'hidden',
                transition: `grid-template-rows var(--motion-base, 0.35s) var(--ease, ease-out), visibility 0s linear ${isOpen ? '0s' : 'var(--motion-base, 0.35s)'}`,
              }}
            >
              <div
                data-accordion-inner=""
                style={{
                  overflow: 'hidden',
                  minHeight: 0,
                  opacity: isOpen ? 1 : 0,
                  transition: 'opacity var(--motion-base, 0.35s) var(--ease, ease-out)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    paddingBottom: '1.25rem',
                    color: 'var(--color-body, #E6E1DE)',
                    fontFamily: BODY_FONT,
                    lineHeight: 1.7,
                    fontSize: '0.92rem',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {item.body}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
