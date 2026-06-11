'use client'

import { Puck, type Data } from '@measured/puck'
import '@measured/puck/puck.css'
import { useState } from 'react'
import Link from 'next/link'
import { config } from '../puck.config'

// Per-page Puck editor (TYN-216). Saves the document for `slug` via the save
// API; Publish marks the page published so it renders at /{slug}. Puck's
// preview iframe is disabled so the save fetch keeps the session cookie.
export function EditorClient({
  slug,
  title,
  published,
  initialData,
}: {
  slug: string
  title: string
  published: boolean
  initialData: Data
}) {
  const [status, setStatus] = useState<string>(published ? '' : 'Draft')

  const onPublish = async (data: Data) => {
    setStatus('Saving...')
    try {
      const res = await fetch('/api/builder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slug, data }),
      })
      setStatus(res.ok ? 'Published' : 'Save failed')
    } catch {
      setStatus('Save failed')
    }
  }

  return (
    <div style={{ height: '100vh' }}>
      <Puck
        config={config}
        data={initialData}
        onPublish={onPublish}
        iframe={{ enabled: false }}
        headerTitle={title}
        headerPath={status || undefined}
        overrides={{
          headerActions: ({ children }) => (
            <>
              <Link
                href="/builder"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 0.85rem',
                  height: '34px',
                  borderRadius: '4px',
                  border: '1px solid var(--puck-color-grey-09, #d4d4d4)',
                  color: 'inherit',
                  textDecoration: 'none',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                }}
              >
                &#8592; Pages
              </Link>
              <Link
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0 0.85rem',
                  height: '34px',
                  borderRadius: '4px',
                  border: '1px solid var(--puck-color-grey-09, #d4d4d4)',
                  color: 'inherit',
                  textDecoration: 'none',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                }}
              >
                View Page &#8599;
              </Link>
              {children}
            </>
          ),
        }}
      />
    </div>
  )
}
