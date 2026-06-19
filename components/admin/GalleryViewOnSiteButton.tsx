'use client'
import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

export function GalleryViewOnSiteButton() {
  const { id } = useDocumentInfo()
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)
  const title = useFormFields(([fields]) => fields.title?.value as string | undefined)

  // Only show after the gallery is saved. The slug field is pre-populated from
  // the title on the create form, so checking slug alone shows the button on
  // unsaved docs where no public page exists yet.
  if (!id || !slug) return null

  const label = title ? `Preview "${title}"` : 'Preview Gallery'
  const url = `https://tynnellhollinsphotography.com/portfolio/${slug}`

  return (
    <div style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(155,154,154,0.12)' }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          width: '100%',
          padding: '0.55rem 0.75rem',
          background: 'rgba(214,209,206,0.08)',
          border: '1px solid rgba(214,209,206,0.25)',
          borderRadius: '4px',
          color: '#D6D1CE',
          fontSize: '0.82rem',
          fontFamily: 'Archivo, sans-serif',
          fontWeight: 500,
          textDecoration: 'none',
          boxSizing: 'border-box',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.background = 'rgba(214,209,206,0.14)'
          el.style.borderColor = 'rgba(214,209,206,0.5)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.background = 'rgba(214,209,206,0.08)'
          el.style.borderColor = 'rgba(214,209,206,0.25)'
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '0.9rem' }}>&#128065;</span>
        {label}
        <span aria-hidden="true" style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: 'auto' }}>↗</span>
      </a>
      <p style={{ margin: '0.35rem 0 0', fontSize: '0.68rem', color: '#6b6a6a', lineHeight: 1.4, fontFamily: 'Archivo, sans-serif' }}>
        Opens your live gallery page in a new tab. Use the eye icon in the toolbar above to preview inside the admin.
      </p>
    </div>
  )
}
