'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

type FeatureItem = {
  id?: string | null
  feature?: string | null
}

type ServiceDoc = {
  id: number
  title?: string | null
  eyebrow?: string | null
  description?: string | null
  features?: FeatureItem[] | null
  price?: string | null
  depositAmount?: number | null
  displayOrder?: number | null
}

const css = {
  root: {
    padding: '1.5rem',
    fontFamily: 'var(--font-body, system-ui, sans-serif)',
    color: 'var(--theme-text, #e6e1de)',
    minHeight: '100vh',
  } as React.CSSProperties,
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  newBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.5rem 1rem',
    background: 'var(--theme-success-500, #10B981)',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  count: {
    fontSize: '0.8rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    whiteSpace: 'nowrap' as const,
    marginLeft: 'auto',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1rem',
  } as React.CSSProperties,
  card: {
    background: 'var(--theme-elevation-100, #131313)',
    borderRadius: '6px',
    textDecoration: 'none',
    color: 'inherit',
    display: 'flex',
    flexDirection: 'column' as const,
    border: '1px solid var(--theme-elevation-200, #1a1a1a)',
    transition: 'border-color 0.15s, transform 0.15s',
    padding: '1.1rem',
    gap: '0.5rem',
  } as React.CSSProperties,
  eyebrow: {
    fontSize: '0.62rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--theme-text-dim, #9b9a9a)',
    fontFamily: 'Roboto Mono, monospace',
  } as React.CSSProperties,
  title: {
    fontSize: '1rem',
    fontWeight: 600,
    fontFamily: 'Archivo, sans-serif',
    color: 'var(--theme-text, #e6e1de)',
    lineHeight: 1.25,
  } as React.CSSProperties,
  description: {
    fontSize: '0.75rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    lineHeight: 1.55,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  } as React.CSSProperties,
  divider: {
    height: '1px',
    background: 'var(--theme-elevation-200, #1a1a1a)',
    margin: '0.1rem 0',
  } as React.CSSProperties,
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    marginTop: 'auto',
  } as React.CSSProperties,
  priceBadge: {
    padding: '0.16rem 0.55rem',
    background: 'rgba(155,154,154,0.1)',
    border: '1px solid rgba(155,154,154,0.2)',
    borderRadius: '3px',
    fontSize: '0.72rem',
    color: '#d6d1ce',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  depositBadge: {
    padding: '0.16rem 0.55rem',
    background: 'rgba(16,185,129,0.08)',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: '3px',
    fontSize: '0.68rem',
    color: 'rgba(16,185,129,0.85)',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  featureCount: {
    fontSize: '0.62rem',
    color: 'rgba(155,154,154,0.55)',
    fontFamily: 'Roboto Mono, monospace',
  } as React.CSSProperties,
  orderNum: {
    fontSize: '0.62rem',
    color: 'rgba(155,154,154,0.4)',
    fontFamily: 'Roboto Mono, monospace',
  } as React.CSSProperties,
  skeleton: {
    background: 'var(--theme-elevation-200, #1a1a1a)',
    borderRadius: '6px',
    height: '160px',
    animation: 'pulse 1.5s infinite',
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: '4rem 2rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    fontSize: '0.9rem',
  } as React.CSSProperties,
}

export function ServicesGridView() {
  const [services, setServices] = useState<ServiceDoc[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/services?limit=100&depth=0&sort=displayOrder', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setServices(data.docs ?? [])
        setTotal(data.totalDocs ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={css.root}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .service-card:hover { border-color: var(--theme-elevation-400, #3a3a3a) !important; transform: translateY(-2px); }
      `}</style>

      {/* Toolbar */}
      <div style={css.toolbar}>
        <Link href="/admin/collections/services/create" style={css.newBtn}>
          + New Service
        </Link>
        {!loading && (
          <span style={css.count}>
            {total} {total === 1 ? 'service' : 'services'}
          </span>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={css.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={css.skeleton} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div style={css.empty}>
          No services yet. Click New Service above to add your first one.
        </div>
      ) : (
        <div style={css.grid}>
          {services.map(svc => {
            const featureCount = svc.features?.length ?? 0
            return (
              <Link
                key={svc.id}
                href={`/admin/collections/services/${svc.id}`}
                style={css.card}
                className="service-card"
                title={svc.title ?? ''}
              >
                {svc.eyebrow && <div style={css.eyebrow}>{svc.eyebrow}</div>}
                <div style={css.title}>{svc.title ?? 'Untitled'}</div>
                {svc.description && <div style={css.description}>{svc.description}</div>}

                <div style={css.divider} />

                {/* Bottom row: price + deposit + feature count + order */}
                <div style={css.row}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {svc.price && <span style={css.priceBadge}>{svc.price}</span>}
                    {svc.depositAmount != null && (
                      <span style={css.depositBadge}>
                        Bookable &middot; ${svc.depositAmount} deposit
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {featureCount > 0 && (
                      <span style={css.featureCount}>{featureCount} item{featureCount !== 1 ? 's' : ''}</span>
                    )}
                    {svc.displayOrder != null && (
                      <span style={css.orderNum}>#{svc.displayOrder}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
