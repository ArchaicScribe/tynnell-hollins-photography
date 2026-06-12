'use client'

import { useState } from 'react'

// New-page form with a live slug preview (TYN-224). The createPage server
// action is passed in from the server page.
function toSlug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function NewPageForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const slug = toSlug(title)

  return (
    <div style={{ margin: '1.5rem 0 2rem' }}>
      <form action={action} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New page title"
          required
          style={{ flex: 1, background: '#1a1a1a', border: '1px solid rgba(155,154,154,0.25)', color: '#e6e1de', padding: '0.6rem 0.8rem', borderRadius: 4, fontFamily: 'inherit' }}
        />
        <button
          type="submit"
          style={{ background: '#9b9a9a', color: '#0c0c0c', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.8rem' }}
        >
          + New Page
        </button>
      </form>
      {slug && (
        <p style={{ color: '#6b6a6a', fontSize: '0.72rem', marginTop: '0.4rem' }}>
          Web address: <span style={{ color: '#9b9a9a' }}>/{slug}</span>
        </p>
      )}
    </div>
  )
}
