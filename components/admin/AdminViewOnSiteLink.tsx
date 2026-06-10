'use client'
import React from 'react'

/**
 * Shared presentational "View on Site" link for admin edit views.
 * Galleries, the About page, and Photos each render this with their own URL
 * and label; keeping the styling in one place avoids duplicating ~50 lines of
 * inline styles across every content type. (PostViewOnSiteButton predates this
 * and keeps its own copy for now.)
 */
export function AdminViewOnSiteLink({
  url,
  label = 'View on Site',
  note,
  dimmed = false,
}: {
  url: string
  label?: string
  note?: string
  dimmed?: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      padding: '0.75rem 0',
      borderBottom: '1px solid rgba(155,154,154,0.12)',
    }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.78rem',
          fontFamily: "'Roboto Mono', monospace",
          letterSpacing: '0.05em',
          color: dimmed ? '#9B9A9A' : '#D6D1CE',
          textDecoration: 'none',
          padding: '0.45rem 0.75rem',
          border: `1px solid ${dimmed ? 'rgba(155,154,154,0.25)' : 'rgba(214,209,206,0.3)'}`,
          borderRadius: '4px',
          background: 'transparent',
          transition: 'border-color 0.15s, color 0.15s',
          width: 'fit-content',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.borderColor = dimmed ? 'rgba(155,154,154,0.5)' : 'rgba(214,209,206,0.7)'
          el.style.color = '#E6E1DE'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.borderColor = dimmed ? 'rgba(155,154,154,0.25)' : 'rgba(214,209,206,0.3)'
          el.style.color = dimmed ? '#9B9A9A' : '#D6D1CE'
        }}
      >
        {label}
        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>↗</span>
      </a>
      {note && (
        <p style={{
          margin: 0,
          fontSize: '0.67rem',
          fontFamily: "'Roboto Mono', monospace",
          color: '#6b6a6a',
          letterSpacing: '0.04em',
          lineHeight: 1.4,
        }}>
          {note}
        </p>
      )}
    </div>
  )
}
