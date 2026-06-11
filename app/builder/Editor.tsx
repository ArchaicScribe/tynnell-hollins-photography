'use client'

import { Puck, type Data } from '@measured/puck'
import '@measured/puck/puck.css'
import { useState } from 'react'
import { config } from './puck.config'

// Client editor for the Puck POC (TYN-214). Renders the full drag-drop canvas.
// Puck's built-in "Publish" button calls onPublish; we persist the document to
// the `builder` Payload global via the save API.
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
      setStatus(res.ok ? 'Published! View at /landing' : 'Save failed')
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
        headerTitle="Page Builder"
        headerPath={status || undefined}
      />
    </div>
  )
}
