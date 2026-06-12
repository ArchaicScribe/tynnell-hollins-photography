'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Duplicate a builder page (TYN-224). Creates an unpublished copy, then
// refreshes the list so it appears.
export function DuplicatePageButton({ id }: { id: number | string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const duplicate = async () => {
    setBusy(true)
    try {
      await fetch('/api/builder/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={duplicate}
      disabled={busy}
      style={{ cursor: 'pointer', fontSize: '0.78rem', padding: '0.35rem 0.7rem', borderRadius: 4, fontFamily: 'inherit', border: '1px solid rgba(155,154,154,0.25)', background: 'transparent', color: '#9b9a9a' }}
    >
      {busy ? '...' : 'Duplicate'}
    </button>
  )
}
