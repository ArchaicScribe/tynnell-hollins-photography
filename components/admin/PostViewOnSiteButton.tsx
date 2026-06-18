'use client'
import React from 'react'
import { useFormFields } from '@payloadcms/ui'

export function PostViewOnSiteButton() {
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)
  const status = useFormFields(([fields]) => fields.status?.value as string | undefined)

  // Don't render until the slug is available (new unsaved post)
  if (!slug) return null

  const url = `https://tynnellhollinsphotography.com/blog/${slug}`
  const isDraft = !status || status === 'draft'

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
          color: isDraft ? '#9B9A9A' : '#D6D1CE',
          textDecoration: 'none',
          padding: '0.45rem 0.75rem',
          border: `1px solid ${isDraft ? 'rgba(155,154,154,0.25)' : 'rgba(214,209,206,0.3)'}`,
          borderRadius: '4px',
          background: 'transparent',
          transition: 'border-color 0.15s, color 0.15s',
          width: 'fit-content',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.borderColor = isDraft ? 'rgba(155,154,154,0.5)' : 'rgba(214,209,206,0.7)'
          el.style.color = '#E6E1DE'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.borderColor = isDraft ? 'rgba(155,154,154,0.25)' : 'rgba(214,209,206,0.3)'
          el.style.color = isDraft ? '#9B9A9A' : '#D6D1CE'
        }}
      >
        View on Site
        <span aria-hidden="true" style={{ fontSize: '0.7rem', opacity: 0.7 }}>↗</span>
      </a>
      {isDraft && (
        <p style={{
          margin: 0,
          fontSize: '0.67rem',
          fontFamily: "'Roboto Mono', monospace",
          color: '#6b6a6a',
          letterSpacing: '0.04em',
        }}>
          Draft - not visible to visitors yet
        </p>
      )}
    </div>
  )
}
