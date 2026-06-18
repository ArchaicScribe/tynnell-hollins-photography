'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Up/down reorder controls for the builder page list (TYN-225).
export function ReorderButtons({ id, isFirst, isLast }: { id: number | string; isFirst: boolean; isLast: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const move = async (direction: 'up' | 'down') => {
    setBusy(true)
    try {
      await fetch('/api/builder/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, direction }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const arrow = (disabled: boolean): React.CSSProperties => ({
    cursor: disabled ? 'default' : 'pointer',
    background: 'transparent',
    border: '1px solid rgba(155,154,154,0.22)',
    color: '#9b9a9a',
    borderRadius: 3,
    width: 22,
    height: 18,
    fontSize: '0.7rem',
    lineHeight: 1,
    padding: 0,
    opacity: disabled ? 0.3 : 1,
  })

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.15rem' }}>
      <button type="button" onClick={() => move('up')} disabled={busy || isFirst} aria-busy={busy} style={arrow(isFirst)} title="Move up" aria-label="Move up">
        &#8593;
      </button>
      <button type="button" onClick={() => move('down')} disabled={busy || isLast} aria-busy={busy} style={arrow(isLast)} title="Move down" aria-label="Move down">
        &#8595;
      </button>
    </span>
  )
}
