'use client'

import Link from 'next/link'
import type { SaveStatus } from './BlogEditorShell'

const STATUS_LABEL: Record<SaveStatus, string> = {
  saved: 'All changes saved',
  saving: 'Saving...',
  unsaved: 'Unsaved changes',
  error: 'Failed to save',
}

const STATUS_COLOR: Record<SaveStatus, string> = {
  saved: '#9B9A9A',
  saving: '#9B9A9A',
  unsaved: '#D6D1CE',
  error: '#f0a3a3',
}

export function BlogEditorTopBar({
  status,
  published,
  onOpenSettings,
  onPublish,
  publishing,
}: {
  status: SaveStatus
  published: boolean
  onOpenSettings: () => void
  onPublish: () => void
  publishing: boolean
}) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        background: 'rgba(12,12,12,0.92)',
        borderBottom: '1px solid rgba(214,209,206,0.1)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link
          href="/blog-editor"
          aria-label="Back to all posts"
          style={{ color: '#D6D1CE', textDecoration: 'none', fontSize: '1.1rem', lineHeight: 1 }}
        >
          &larr;
        </Link>
        <span style={{ fontSize: '0.72rem', fontFamily: "'Poppins', sans-serif", color: STATUS_COLOR[status] }}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <button type="button" onClick={onOpenSettings} style={ghostBtn}>
          Post Settings
        </button>
        <button type="button" onClick={onPublish} disabled={publishing} aria-busy={publishing} style={primaryBtn(publishing)}>
          {publishing ? 'Publishing...' : published ? 'Update Published Post' : 'Publish Post'}
        </button>
      </div>
    </div>
  )
}

const ghostBtn: React.CSSProperties = {
  cursor: 'pointer',
  fontFamily: "'Poppins', sans-serif",
  fontSize: '0.75rem',
  borderRadius: 4,
  border: '1px solid rgba(155,154,154,0.3)',
  background: 'transparent',
  color: '#D6D1CE',
  padding: '0.45rem 0.85rem',
}

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  cursor: disabled ? 'default' : 'pointer',
  fontFamily: "'Poppins', sans-serif",
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: 4,
  border: 'none',
  background: '#9B9A9A',
  color: '#0C0C0C',
  padding: '0.45rem 0.95rem',
  opacity: disabled ? 0.6 : 1,
})
