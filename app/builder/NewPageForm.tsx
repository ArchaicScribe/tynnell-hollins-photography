'use client'

import { useState } from 'react'
import { templateOptions, type TemplateKey } from './templates'

// New-page form with a live slug preview (TYN-224) and a starter-template
// picker (TYN-230). The createPage server action is passed in from the server
// page; the chosen template is submitted as a hidden field.
function toSlug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function NewPageForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [template, setTemplate] = useState<TemplateKey>('landing')
  const slug = toSlug(title)

  return (
    <div style={{ margin: '1.5rem 0 2rem' }}>
      <form action={action}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            name="title"
            aria-label="New page title"
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
        </div>

        <input type="hidden" name="template" value={template} />

        <p style={{ color: '#9b9a9a', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '1rem 0 0.5rem' }}>
          Start with
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
          {templateOptions.map((opt) => {
            const active = template === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => setTemplate(opt.value)}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: active ? '#1f1f1f' : '#131313',
                  border: active ? '1px solid #d6d1ce' : '1px solid rgba(155,154,154,0.18)',
                  borderRadius: 5,
                  padding: '0.7rem 0.85rem',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: active ? '#d6d1ce' : '#c8c3c0', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span style={{ fontSize: '0.9rem' }} aria-hidden="true">{active ? '◉' : '○'}</span>
                  {opt.label}
                </span>
                <span style={{ display: 'block', color: '#6b6a6a', fontSize: '0.72rem', lineHeight: 1.45, marginTop: '0.3rem' }}>
                  {opt.description}
                </span>
              </button>
            )
          })}
        </div>
      </form>

      {slug && (
        <p style={{ color: '#6b6a6a', fontSize: '0.72rem', marginTop: '0.6rem' }}>
          Web address: <span style={{ color: '#9b9a9a' }}>/{slug}</span>
        </p>
      )}
    </div>
  )
}
