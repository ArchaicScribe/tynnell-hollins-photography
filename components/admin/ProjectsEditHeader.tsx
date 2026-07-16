'use client'
import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

const STATUS_LABELS: Record<string, string> = {
  inquiry: 'Inquiry',
  booked: 'Booked',
  'post-production': 'Post-Production',
  delivered: 'Delivered',
  archived: 'Archived',
}

const STATUS_COLORS: Record<string, string> = {
  inquiry: '#9b9a9a',
  booked: '#60a5fa',
  'post-production': '#e0b060',
  delivered: '#7ed99a',
  archived: '#6b6a6a',
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  portrait: 'Portrait',
  wedding: 'Wedding',
  family: 'Family',
  couples: 'Couples',
  brand: 'Brand',
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export function ProjectsEditHeader() {
  const { id } = useDocumentInfo()
  const title = useFormFields(([fields]) => fields.title?.value as string | undefined)
  const clientName = useFormFields(([fields]) => fields.clientName?.value as string | undefined)
  const clientEmail = useFormFields(([fields]) => fields.clientEmail?.value as string | undefined)
  const status = useFormFields(([fields]) => fields.status?.value as string | undefined)
  const projectType = useFormFields(([fields]) => fields.projectType?.value as string | undefined)
  const projectDate = useFormFields(([fields]) => fields.projectDate?.value as string | undefined)
  const sessions = useFormFields(([fields]) => fields.sessions?.value as unknown[] | undefined)
  const payments = useFormFields(([fields]) => fields.payments?.value as unknown[] | undefined)
  const documents = useFormFields(([fields]) => fields.documents?.value as unknown[] | undefined)

  if (!id) return null

  const sessionCount = Array.isArray(sessions) ? sessions.length : 0
  const paymentCount = Array.isArray(payments) ? payments.length : 0
  const documentCount = Array.isArray(documents) ? documents.length : 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        background: '#161616',
        border: '1px solid rgba(155,154,154,0.18)',
        borderRadius: 8,
        padding: '1.25rem',
        marginBottom: '1.75rem',
      }}
    >
      <div>
        <div style={{ color: '#D6D1CE', fontSize: '1.1rem', fontWeight: 500, fontFamily: "'Archivo', sans-serif", letterSpacing: '-0.01em' }}>
          {title || 'Untitled Project'}
        </div>
        {(clientName || clientEmail) && (
          <div style={{ color: '#9B9A9A', fontSize: '0.82rem', marginTop: '0.3rem' }}>
            {clientName}
            {clientName && clientEmail ? ' · ' : ''}
            {clientEmail && <span style={{ fontFamily: "'Roboto Mono', monospace" }}>{clientEmail}</span>}
          </div>
        )}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
        {status && (
          <span
            style={{
              fontSize: '0.7rem',
              color: STATUS_COLORS[status] ?? '#9b9a9a',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 3,
              padding: '0.15rem 0.5rem',
            }}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        )}

        {projectType && (
          <span
            style={{
              fontSize: '0.72rem',
              padding: '0.25rem 0.6rem',
              borderRadius: 4,
              border: '1px solid rgba(155,154,154,0.3)',
              color: '#c8c3c0',
            }}
          >
            {PROJECT_TYPE_LABELS[projectType] ?? projectType}
          </span>
        )}

        {projectDate && (
          <span style={{ fontSize: '0.72rem', color: '#6b6a6a' }}>{fmtDate(projectDate)}</span>
        )}

        {sessionCount > 0 && (
          <span style={{ fontSize: '0.62rem', color: 'rgba(155,154,154,0.55)', fontFamily: "'Roboto Mono', monospace" }}>
            {sessionCount} session{sessionCount !== 1 ? 's' : ''}
          </span>
        )}

        {paymentCount > 0 && (
          <span style={{ fontSize: '0.62rem', color: 'rgba(155,154,154,0.55)', fontFamily: "'Roboto Mono', monospace" }}>
            {paymentCount} payment{paymentCount !== 1 ? 's' : ''}
          </span>
        )}

        {documentCount > 0 && (
          <span style={{ fontSize: '0.62rem', color: 'rgba(155,154,154,0.55)', fontFamily: "'Roboto Mono', monospace" }}>
            {documentCount} document{documentCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
