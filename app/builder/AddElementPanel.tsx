'use client'

import { useState } from 'react'
import { usePuck } from '@measured/puck'

// TYN-355: "+ Add Element" trigger + icon-grid panel, shown alongside
// SectionHoverToolbar (unmodified) only for FreeformSection - see
// BuilderOverlay.tsx for how the two are composed. Bottom-right placement
// keeps it clear of SectionHoverToolbar's own top-right pill.
//
// Freeform elements are real Puck components (see puck.config.tsx's
// `freeformElements` category, `visible: false` - registered so they can live
// in a slot, but never shown in the main drawer). Inserting one dispatches
// Puck's public `insert` action directly at the FreeformSection's own slot
// zone (`${componentId}:elements`), the same call proven in the Phase 0 spike.
const ELEMENT_TYPES: { type: string; label: string; icon: () => React.ReactNode }[] = [
  { type: 'TextElement', label: 'Text', icon: TextIcon },
  { type: 'ImageElement', label: 'Image', icon: ImageIcon },
  { type: 'ButtonElement', label: 'Button', icon: ButtonIcon },
  { type: 'ShapeElement', label: 'Shape', icon: ShapeIcon },
]

export function AddElementTrigger({
  componentId,
  hover,
  isSelected,
}: {
  componentId: string
  hover: boolean
  isSelected: boolean
}) {
  const { dispatch, getItemById } = usePuck()
  const [open, setOpen] = useState(false)
  const visible = hover || isSelected

  if (!visible && !open) return null

  const addElement = (type: string) => {
    const section = getItemById(componentId)
    const elements = (section?.props as { elements?: unknown[] } | undefined)?.elements ?? []
    dispatch({
      type: 'insert',
      componentType: type,
      destinationIndex: elements.length,
      destinationZone: `${componentId}:elements`,
    })
    setOpen(false)
  }

  return (
    <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 20, pointerEvents: 'auto' }}>
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: 8,
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
            padding: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 6,
            width: 160,
          }}
        >
          {ELEMENT_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                addElement(type)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 6px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#e6e1de',
                fontSize: 11,
                fontFamily: "var(--font-body, 'Roboto Mono', monospace)",
                cursor: 'pointer',
              }}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          padding: '8px 14px',
          background: '#1a1a1a',
          color: '#e6e1de',
          fontSize: 12.5,
          fontWeight: 500,
          fontFamily: "var(--font-body, 'Roboto Mono', monospace)",
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 8,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
        }}
      >
        + Add Element
      </button>
    </div>
  )
}

function TextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  )
}

function ButtonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="8" rx="2" />
      <path d="M7 12h6" />
    </svg>
  )
}

function ShapeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}
