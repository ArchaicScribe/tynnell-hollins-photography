'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Inline page-title rename for the builder list (TYN-223). Renames the display
// title only; the slug (and published URL) stays put.
export function PageTitleEditor({ id, title }: { id: number | string; title: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(title)
  const [saving, setSaving] = useState(false)

  const cancel = () => {
    setVal(title)
    setEditing(false)
  }

  const save = async () => {
    const name = val.trim()
    if (!name || name === title) {
      cancel()
      return
    }
    setSaving(true)
    try {
      await fetch('/api/builder/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, title: name }),
      })
      router.refresh()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <span style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
        <input
          value={val}
          autoFocus
          aria-label="Page title"
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') cancel()
          }}
          style={{ background: '#232323', color: '#e6e1de', border: '1px solid rgba(155,154,154,0.3)', borderRadius: 4, padding: '0.25rem 0.5rem', fontFamily: 'inherit', fontSize: '0.9rem' }}
        />
        <button type="button" onClick={save} disabled={saving} aria-busy={saving} style={chip('#d6d1ce', '#0c0c0c')}>
          {saving ? '...' : 'Save'}
        </button>
        <button type="button" onClick={cancel} disabled={saving} style={chip('transparent', '#9b9a9a')}>
          Cancel
        </button>
      </span>
    )
  }

  return (
    <span style={{ display: 'inline-flex', gap: '0.55rem', alignItems: 'baseline' }}>
      <span style={{ color: '#d6d1ce', fontFamily: "var(--font-heading, Archivo, sans-serif)" }}>{title}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        style={{ background: 'transparent', border: 'none', color: '#6b6a6a', cursor: 'pointer', fontSize: '0.7rem', textDecoration: 'underline', padding: 0, fontFamily: 'inherit' }}
      >
        Rename
      </button>
    </span>
  )
}

function chip(bg: string, color: string): React.CSSProperties {
  return {
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.72rem',
    padding: '0.25rem 0.6rem',
    borderRadius: 4,
    border: '1px solid rgba(155,154,154,0.3)',
    background: bg,
    color,
  }
}
