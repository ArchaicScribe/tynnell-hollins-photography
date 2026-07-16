'use client'
import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  editor: 'Content Editor',
}

function initialsOf(name: string | undefined, email: string | undefined): string {
  if (name) return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
  return email?.[0]?.toUpperCase() ?? '?'
}

export function UsersEditHeader() {
  const { id } = useDocumentInfo()
  const name = useFormFields(([fields]) => fields.name?.value as string | undefined)
  const email = useFormFields(([fields]) => fields.email?.value as string | undefined)
  const role = useFormFields(([fields]) => fields.role?.value as string | undefined)
  const mustChangePassword = useFormFields(([fields]) => fields.mustChangePassword?.value as boolean | undefined)

  if (!id) return null

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.25rem',
        alignItems: 'center',
        background: '#161616',
        border: '1px solid rgba(155,154,154,0.18)',
        borderRadius: 8,
        padding: '1.25rem',
        marginBottom: '1.75rem',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          flexShrink: 0,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#1db48e,#0d9488)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          fontWeight: 700,
          color: '#0c0c0c',
        }}
      >
        {initialsOf(name, email)}
      </div>

      {/* Meta */}
      <div style={{ flex: '1 1 220px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div>
          <div style={{ color: '#D6D1CE', fontSize: '1.1rem', fontWeight: 500, fontFamily: "'Archivo', sans-serif", letterSpacing: '-0.01em' }}>
            {name || '<No Full Name>'}
          </div>
          {email && (
            <div style={{ color: '#6b6a6a', fontSize: '0.78rem', marginTop: '0.15rem', fontFamily: "'Roboto Mono', monospace" }}>
              {email}
            </div>
          )}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '0.25rem 0.6rem',
              borderRadius: 4,
              border: '1px solid rgba(155,154,154,0.3)',
              color: '#c8c3c0',
            }}
          >
            {role ? (ROLE_LABELS[role] ?? role) : 'No role'}
          </span>

          {mustChangePassword && (
            <span
              style={{
                padding: '0.1rem 0.4rem',
                background: 'rgba(251,146,60,0.12)',
                border: '1px solid rgba(251,146,60,0.3)',
                borderRadius: 3,
                fontSize: '0.58rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#fb923c',
              }}
            >
              Password reset pending
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
