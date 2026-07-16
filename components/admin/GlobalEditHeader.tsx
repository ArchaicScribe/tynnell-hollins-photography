'use client'
import React from 'react'

/**
 * Shared branded header strip for global settings edit screens (SiteConfig,
 * BookingSettings, HeroSlides). Sits above Payload's stock form as a `ui`
 * field, same additive pattern as PhotoEditHeader - Payload still owns the
 * breadcrumb, save bar, and field rendering underneath.
 */
export function GlobalEditHeader({
  icon,
  title,
  description,
  viewOnSiteUrl,
  viewOnSiteLabel = 'View on Site',
}: {
  icon: string
  title: string
  description: string
  viewOnSiteUrl?: string
  viewOnSiteLabel?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        background: '#161616',
        border: '1px solid rgba(155,154,154,0.18)',
        borderRadius: 8,
        padding: '1.25rem',
        marginBottom: '1.75rem',
      }}
    >
      <div
        style={{
          flex: '0 0 auto',
          width: 44,
          height: 44,
          borderRadius: 8,
          background: 'rgba(214,209,206,0.08)',
          border: '1px solid rgba(155,154,154,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem',
        }}
        aria-hidden="true"
      >
        {icon}
      </div>

      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <div
          style={{
            color: '#D6D1CE',
            fontSize: '1.1rem',
            fontWeight: 500,
            fontFamily: "'Archivo', sans-serif",
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </div>
        <p
          style={{
            margin: '0.35rem 0 0',
            color: '#9B9A9A',
            fontSize: '0.82rem',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>

        {viewOnSiteUrl && (
          <a
            href={viewOnSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginTop: '0.75rem',
              fontSize: '0.72rem',
              fontFamily: "'Roboto Mono', monospace",
              letterSpacing: '0.05em',
              color: '#9B9A9A',
              textDecoration: 'none',
              padding: '0.4rem 0.7rem',
              border: '1px solid rgba(155,154,154,0.3)',
              borderRadius: 4,
              background: 'transparent',
              width: 'fit-content',
            }}
          >
            {viewOnSiteLabel}
            <span aria-hidden="true" style={{ fontSize: '0.68rem', opacity: 0.7 }}>↗</span>
          </a>
        )}
      </div>
    </div>
  )
}
