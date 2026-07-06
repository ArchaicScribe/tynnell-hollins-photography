'use client'

import { useEffect, useRef, useState } from 'react'

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'style-guide', label: 'Style Guide' },
  { value: 'portrait-sessions', label: 'Portrait Sessions' },
  { value: 'weddings', label: 'Weddings' },
  { value: 'behind-the-lens', label: 'Behind the Lens' },
  { value: 'client-education', label: 'Client Education' },
]

export function CategoryPicker({
  value,
  onChange,
}: {
  value: string | null | undefined
  onChange: (next: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const currentLabel = CATEGORIES.find(c => c.value === value)?.label

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          font: 'inherit',
          color: 'inherit',
          textDecoration: 'underline',
          textUnderlineOffset: '3px',
          opacity: 0.85,
        }}
      >
        {currentLabel ?? 'Click to select categories'}
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.4rem)',
            left: 0,
            zIndex: 20,
            background: '#1a1a1a',
            border: '1px solid rgba(214,209,206,0.18)',
            borderRadius: 6,
            padding: '0.35rem',
            minWidth: 180,
          }}
        >
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              type="button"
              role="option"
              aria-selected={c.value === value}
              onClick={() => { onChange(c.value); setOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.4rem 0.6rem',
                background: c.value === value ? 'rgba(214,209,206,0.12)' : 'transparent',
                border: 'none',
                borderRadius: 4,
                color: '#D6D1CE',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
