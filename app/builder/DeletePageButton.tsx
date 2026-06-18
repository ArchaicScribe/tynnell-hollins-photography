'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Delete a builder page with an inline confirm (TYN-219).
export function DeletePageButton({ id }: { id: number | string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const del = async () => {
    setDeleting(true)
    try {
      await fetch('/api/builder/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      })
      router.refresh()
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  const base: React.CSSProperties = {
    cursor: 'pointer',
    fontSize: '0.78rem',
    padding: '0.35rem 0.7rem',
    borderRadius: 4,
    fontFamily: 'inherit',
    border: '1px solid rgba(155,154,154,0.25)',
    background: 'transparent',
  }

  if (confirming) {
    return (
      <span style={{ display: 'inline-flex', gap: '0.35rem' }}>
        <button type="button" onClick={del} disabled={deleting} aria-busy={deleting} style={{ ...base, border: '1px solid rgba(248,113,113,0.5)', color: '#f87171' }}>
          {deleting ? '...' : 'Delete'}
        </button>
        <button type="button" onClick={() => setConfirming(false)} disabled={deleting} style={{ ...base, color: '#9b9a9a' }}>
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} style={{ ...base, color: '#9b9a9a' }}>
      Delete
    </button>
  )
}
