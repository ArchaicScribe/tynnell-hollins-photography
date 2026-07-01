'use client'
import { useRowLabel } from '@payloadcms/ui'

const TYPE_LABELS: Record<string, string> = {
  portrait: 'Portrait',
  engagement: 'Engagement',
  'wedding-ceremony': 'Wedding Ceremony',
  'wedding-reception': 'Wedding Reception',
  family: 'Family',
  couples: 'Couples',
  brand: 'Brand',
}

function formatDate(value?: string): string {
  if (!value) return 'No date set'
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export function SessionRowLabel() {
  const { data } = useRowLabel<{ sessionType?: string; sessionDate?: string }>()
  const type = data.sessionType ? TYPE_LABELS[data.sessionType] ?? data.sessionType : 'Session'
  return <span>{type} - {formatDate(data.sessionDate)}</span>
}
