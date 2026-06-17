'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'
import { type BlockedRange, computeReturnDate } from '@/app/lib/availability'

function label(range: BlockedRange, index: number): string {
  return range.internalLabel ? `"${range.internalLabel}"` : `Entry ${index + 1}`
}

export function OooWarnings() {
  const { value: ranges } = useField<BlockedRange[]>({ path: 'blockedRanges' })

  if (!Array.isArray(ranges) || ranges.length === 0) return null

  const warnings: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i]
    if (!r.startDate || !r.endDate) continue

    const start = new Date(r.startDate)
    const end = new Date(r.endDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    if (end < start) continue // hard validate handles this

    // Long period (> 60 days)
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (days > 60) {
      warnings.push(
        `${label(r, i)} spans ${days} days — make sure your Booking Settings reflect this long absence.`,
      )
    }

    // Currently active
    const returnDate = computeReturnDate(r)
    if (today >= start && today <= returnDate) {
      warnings.push(
        `${label(r, i)} is currently active — clients visiting the site right now will see your unavailability message.`,
      )
    }

    // Overlap with later entries
    for (let j = i + 1; j < ranges.length; j++) {
      const r2 = ranges[j]
      if (!r2.startDate || !r2.endDate) continue
      const start2 = new Date(r2.startDate)
      const end2 = new Date(r2.endDate)
      start2.setHours(0, 0, 0, 0)
      end2.setHours(0, 0, 0, 0)
      if (start <= end2 && start2 <= end) {
        warnings.push(
          `${label(r, i)} and ${label(r2, j)} have overlapping dates — both will apply to clients.`,
        )
      }
    }
  }

  if (warnings.length === 0) return null

  return (
    <div
      style={{
        margin: '0.5rem 0 1rem',
        padding: '0.75rem 1rem',
        background: 'rgba(251, 191, 36, 0.08)',
        border: '1px solid rgba(251, 191, 36, 0.35)',
        borderRadius: '4px',
      }}
    >
      <p style={{ margin: '0 0 0.4rem', fontWeight: 600, fontSize: '0.78rem', color: '#fbbf24' }}>
        Availability notices
      </p>
      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#d97706' }}>
        {warnings.map((w, i) => (
          <li key={i} style={{ marginBottom: '0.2rem' }}>
            {w}
          </li>
        ))}
      </ul>
    </div>
  )
}
