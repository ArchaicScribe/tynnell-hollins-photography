'use client'
import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

type FeatureRow = { feature?: string }

export function ServicesEditHeader() {
  const { id } = useDocumentInfo()
  const title = useFormFields(([fields]) => fields.title?.value as string | undefined)
  const eyebrow = useFormFields(([fields]) => fields.eyebrow?.value as string | undefined)
  const description = useFormFields(([fields]) => fields.description?.value as string | undefined)
  const price = useFormFields(([fields]) => fields.price?.value as string | undefined)
  const depositAmount = useFormFields(([fields]) => fields.depositAmount?.value as number | undefined)
  const displayOrder = useFormFields(([fields]) => fields.displayOrder?.value as number | undefined)
  const features = useFormFields(([fields]) => fields.features?.value as FeatureRow[] | undefined)

  if (!id) return null

  const featureCount = Array.isArray(features) ? features.length : 0

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
        {eyebrow && (
          <div
            style={{
              color: '#9B9A9A',
              fontSize: '0.68rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
            }}
          >
            {eyebrow}
          </div>
        )}
        <div style={{ color: '#D6D1CE', fontSize: '1.1rem', fontWeight: 500, fontFamily: "'Archivo', sans-serif", letterSpacing: '-0.01em' }}>
          {title || 'Untitled Service'}
        </div>
        {description && (
          <div
            style={{
              color: '#9B9A9A',
              fontSize: '0.82rem',
              lineHeight: 1.5,
              marginTop: '0.4rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </div>
        )}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
        {price && (
          <span
            style={{
              padding: '0.16rem 0.55rem',
              background: 'rgba(155,154,154,0.1)',
              border: '1px solid rgba(155,154,154,0.2)',
              borderRadius: 3,
              fontSize: '0.72rem',
              color: '#d6d1ce',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {price}
          </span>
        )}

        {depositAmount != null && (
          <span
            style={{
              padding: '0.16rem 0.55rem',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 3,
              fontSize: '0.68rem',
              color: 'rgba(16,185,129,0.85)',
              whiteSpace: 'nowrap',
            }}
          >
            Bookable &middot; ${depositAmount} deposit
          </span>
        )}

        {featureCount > 0 && (
          <span style={{ fontSize: '0.62rem', color: 'rgba(155,154,154,0.55)', fontFamily: "'Roboto Mono', monospace" }}>
            {featureCount} item{featureCount !== 1 ? 's' : ''}
          </span>
        )}

        {displayOrder != null && (
          <span style={{ fontSize: '0.62rem', color: 'rgba(155,154,154,0.4)', fontFamily: "'Roboto Mono', monospace" }}>
            #{displayOrder}
          </span>
        )}
      </div>
    </div>
  )
}
