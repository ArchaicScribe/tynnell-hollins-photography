'use client'
import { useRowLabel } from '@payloadcms/ui'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  signed: 'Signed',
  void: 'Void',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'inherit',
  sent: '#e0b060',
  signed: '#7ed99a',
  void: '#f0a3a3',
}

export function DocumentRowLabel() {
  const { data } = useRowLabel<{ title?: string; status?: string }>()
  const status = data.status ? STATUS_LABELS[data.status] ?? data.status : ''
  return (
    <span>
      {data.title || 'Document'}
      {status && (
        <span style={{ marginLeft: '0.5rem', color: STATUS_COLORS[data.status ?? ''] ?? 'inherit', fontWeight: 600 }}>
          ({status})
        </span>
      )}
    </span>
  )
}
