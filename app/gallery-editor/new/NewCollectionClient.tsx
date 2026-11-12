'use client'

import { useEffect, useRef, useState } from 'react'
import { extractPayloadErrorMessage } from '@/app/lib/payloadError'
import { buildCreateCollectionBody } from '@/app/lib/newCollection'

// TYN-311: Pixieset's full-page "Create New Collection", replacing the small
// dialog that used to live in the Collections tab. Name, event date, category
// (this site needs one for the portfolio filters; Pixieset has none) and a
// large Create button. Status and the other new-gallery defaults are not sent:
// the Galleries create hook fills them from Gallery Presets (TYN-323).

const ui = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const teal = '#0d9488'
const CATEGORIES = ['weddings', 'portraits', 'families', 'couples', 'brands'] as const

const fieldStyle = {
  background: '#111',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  padding: '0.8rem 0.9rem',
  color: '#e6e1de',
  fontSize: '0.95rem',
  outline: 'none',
  fontFamily: ui,
  colorScheme: 'dark',
} as const

const labelTextStyle = { fontFamily: ui, fontSize: '0.78rem', fontWeight: 500, color: '#9b9a9a' } as const

export function NewCollectionClient({
  navigate = (url: string) => { window.location.href = url },
}: {
  // The page leaves for the editor through this, so tests can observe it
  // instead of asking jsdom to navigate.
  navigate?: (url: string) => void
}) {
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [category, setCategory] = useState<string>('portraits')
  const [creating, setCreating] = useState(false)
  // The collection exists but could not be opened; no second create.
  const [created, setCreated] = useState(false)
  const [error, setError] = useState('')

  // Set once the user picks a category, so a slow presets response never
  // overwrites their choice.
  const categoryPicked = useRef(false)

  // Start on the Gallery Presets default category (TYN-323), if one is set.
  useEffect(() => {
    fetch('/api/globals/gallery-presets', { credentials: 'include' })
      .then(r => r.json())
      .then((d: { defaultCategory?: string | null }) => {
        if (d.defaultCategory && !categoryPicked.current) setCategory(d.defaultCategory)
      })
      .catch(() => {})
  }, [])

  const canCreate = title.trim().length > 0 && !creating && !created

  const create = async () => {
    if (!canCreate) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCreateCollectionBody({ title, category, eventDate })),
      })
      if (res.ok) {
        const data = (await res.json()) as { doc?: { id: number } }
        const id = data.doc?.id
        if (id) {
          navigate(`/gallery-editor/${id}`)
          return
        }
        // Created but not openable: keep the button disabled so a retry
        // cannot make a duplicate.
        setCreated(true)
        setError('The collection was created, but it could not be opened. Find it in Collections.')
      } else {
        const body = await res.json().catch(() => null)
        setError(extractPayloadErrorMessage(body, 'Could not create collection. Please try again.'))
      }
    } catch {
      setError('Connection error.')
    }
    setCreating(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0e0e0e', color: '#e6e1de', fontFamily: ui }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>
        {/* Cross-root-layout link (/builder has its own root layout), so a plain <a>. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/builder?product=portfolio"
          style={{ display: 'inline-block', marginBottom: '2rem', color: '#9b9a9a', fontSize: '0.85rem', textDecoration: 'none' }}
        >
          &larr; Collections
        </a>

        <h1 style={{ margin: '0 0 2rem', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#d6d1ce' }}>
          Create New Collection
        </h1>

        <form
          onSubmit={e => { e.preventDefault(); void create() }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={labelTextStyle}>Collection name</span>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Smith Wedding"
              style={fieldStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={labelTextStyle}>Event date</span>
            <input
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              style={fieldStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={labelTextStyle}>Category</span>
            <select
              value={category}
              onChange={e => { categoryPicked.current = true; setCategory(e.target.value) }}
              style={{ ...fieldStyle, cursor: 'pointer' }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </label>

          {error && (
            <p role="alert" style={{ margin: 0, fontSize: '0.85rem', color: '#f87171' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!canCreate}
            aria-busy={creating}
            style={{
              background: teal, border: 'none', color: '#fff', borderRadius: 8,
              padding: '0.95rem 1.5rem', fontSize: '1rem', fontWeight: 600, fontFamily: ui,
              cursor: canCreate ? 'pointer' : 'not-allowed', opacity: canCreate ? 1 : 0.5,
            }}
          >
            {creating ? 'Creating...' : 'Create Collection'}
          </button>
        </form>
      </div>
    </main>
  )
}
