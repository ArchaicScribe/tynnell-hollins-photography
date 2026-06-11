'use client'

import { Puck, type Data } from '@measured/puck'
import '@measured/puck/puck.css'
import { useState } from 'react'
import { config } from './puck.config'

// Client editor for the Puck POC (TYN-214). Renders the full drag-drop canvas.
// Puck's preview iframe is disabled so the Publish fetch keeps the session
// cookie (an opaque-origin iframe drops it). Publish persists the document to
// the `builder` global via the save API; a "View Page" header action opens the
// published page so Tynnell never has to type a URL.
export function Editor({ initialData }: { initialData: Partial<Data> }) {
  const [status, setStatus] = useState<string>('')

  const onPublish = async (data: Data) => {
    setStatus('Saving...')
    try {
      const res = await fetch('/api/builder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data }),
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
        data={initialData as Data}
        onPublish={onPublish}
        iframe={{ enabled: false }}
        headerTitle="Page Builder"
        headerPath={status || undefined}
        overrides={{
          headerActions: ({ children }) => (
            <>
              <a
                href="/landing"
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
                View Page ↗
              </a>
              {children}
            </>
          ),
        }}
      />
    </div>
  )
}
