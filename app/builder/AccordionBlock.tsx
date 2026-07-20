'use client'
import { useState } from 'react'

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

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i} style={{ borderBottom: '1px solid rgba(155,154,154,0.18)' }}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
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
                  transition: 'transform 0.2s',
                }}
              >
                &#9660;
              </span>
            </button>
            {isOpen && (
              <p
                style={{
                  margin: '0 0 1.25rem',
                  color: 'var(--color-body, #E6E1DE)',
                  fontFamily: BODY_FONT,
                  lineHeight: 1.7,
                  fontSize: '0.92rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {item.body}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
