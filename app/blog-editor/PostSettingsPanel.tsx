'use client'

import { useEffect, useState } from 'react'

// Slide-over for the handful of Post fields that have no in-canvas click
// target (slug, excerpt, publish date). Saves immediately on blur/change via
// the same /api/blog-editor/save route the autosave uses - infrequent enough
// that a separate debounce isn't worth it. Same role="dialog" + Escape-to-
// close pattern as app/builder/[slug]/EditorClient.tsx's HelpPanel.
export function PostSettingsPanel({
  postId,
  slug: initialSlug,
  excerpt: initialExcerpt,
  publishedAt: initialPublishedAt,
  onClose,
  onSaved,
}: {
  postId: number
  slug: string
  excerpt: string
  publishedAt: string
  onClose: () => void
  onSaved: () => void
}) {
  const [slug, setSlug] = useState(initialSlug)
  const [excerpt, setExcerpt] = useState(initialExcerpt)
  const [publishedAt, setPublishedAt] = useState(initialPublishedAt.slice(0, 16))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/blog-editor/save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, patch }),
      })
      if (!res.ok) throw new Error('save failed')
      onSaved()
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-settings-heading"
        onClick={e => e.stopPropagation()}
        style={{ width: 360, maxWidth: '90vw', height: '100%', background: '#1a1a1a', borderLeft: '1px solid rgba(214,209,206,0.15)', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(214,209,206,0.12)' }}>
          <span id="post-settings-heading" style={{ color: '#D6D1CE', fontWeight: 600, fontFamily: "'Poppins', sans-serif" }}>Post Settings</span>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: '#9B9A9A', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>&times;</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {error && <p role="alert" style={{ margin: 0, color: '#f0a3a3', fontSize: '0.78rem' }}>{error}</p>}

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={fieldLabel}>URL Slug</span>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              onBlur={() => { if (slug !== initialSlug) void save({ slug }) }}
              style={fieldInput}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={fieldLabel}>Short Summary</span>
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              onBlur={() => { if (excerpt !== initialExcerpt) void save({ excerpt }) }}
              rows={3}
              style={{ ...fieldInput, resize: 'vertical', fontFamily: "'Poppins', sans-serif" }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={fieldLabel}>Publish Date</span>
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={e => setPublishedAt(e.target.value)}
              onBlur={() => {
                const iso = new Date(publishedAt).toISOString()
                if (iso !== new Date(initialPublishedAt).toISOString()) void save({ publishedAt: iso })
              }}
              style={fieldInput}
            />
          </label>

          {saving && <p style={{ margin: 0, color: '#9B9A9A', fontSize: '0.72rem' }}>Saving...</p>}
        </div>
      </div>
    </div>
  )
}

const fieldLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#9B9A9A',
  fontFamily: "'Poppins', sans-serif",
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const fieldInput: React.CSSProperties = {
  padding: '0.5rem 0.6rem',
  background: '#232323',
  border: '1px solid rgba(155,154,154,0.25)',
  borderRadius: 4,
  color: '#E6E1DE',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  outline: 'none',
}
