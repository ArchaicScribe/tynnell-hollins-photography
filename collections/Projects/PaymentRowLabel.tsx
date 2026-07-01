'use client'
import { useRowLabel } from '@payloadcms/ui'

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'Upcoming',
  paid: 'Paid',
  'past-due': 'Past Due',
}

function formatAmount(value?: number): string {
  if (typeof value !== 'number') return ''
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function PaymentRowLabel() {
  const { data } = useRowLabel<{ label?: string; amount?: number; status?: string }>()
  const status = data.status ? STATUS_LABELS[data.status] ?? data.status : ''
  const isPastDue = data.status === 'past-due'
  return (
    <span>
      {data.label || 'Payment'}
      {typeof data.amount === 'number' && ` - ${formatAmount(data.amount)}`}
      {status && (
        <span style={{ marginLeft: '0.5rem', color: isPastDue ? '#f0a3a3' : 'inherit', fontWeight: isPastDue ? 600 : 400 }}>
          ({status})
        </span>
      )}
    </span>
  )
}
