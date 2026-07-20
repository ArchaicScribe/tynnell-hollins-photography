'use client'

import type { ReactNode } from 'react'

// TYN-329: visual "Change Layout" picker. Puck has no built-in mechanism for
// per-block layout variants or per-instance thumbnail rendering, so each
// option's "thumbnail" is a small hand-drawn CSS diagram (not a real
// screenshot of the rendered block) - a deliberate scoping tradeoff, real
// screenshots would need a rendering/capture pipeline this ticket doesn't
// build. Selecting an option only changes a `layout` prop the block's own
// render() branches on - the same content fields (heading, image, etc.) are
// shared across every layout for a block, so switching never discards data.
export interface LayoutOption {
  value: string
  label: string
  preview: ReactNode
}

export function LayoutVariantField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: LayoutOption[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: 8,
              borderRadius: 6,
              cursor: 'pointer',
              width: 82,
              background: active ? 'rgba(155,154,154,0.14)' : 'transparent',
              border: active ? '1px solid #9b9a9a' : '1px solid #2a2a2a',
            }}
          >
            <div style={{ width: 62, height: 42, background: '#1a1a1a', borderRadius: 3, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              {opt.preview}
            </div>
            <span style={{ fontSize: 10.5, color: active ? '#e6e1de' : '#9b9a9a', textAlign: 'center', lineHeight: 1.2 }}>{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
