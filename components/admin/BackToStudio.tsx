'use client'
import Link from 'next/link'

export function BackToStudio() {
  return (
    <Link
      href="/studio"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.85rem',
        fontFamily: "'Archivo', sans-serif",
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: '#D6D1CE',
        background: 'rgba(214,209,206,0.08)',
        border: '1px solid rgba(214,209,206,0.18)',
        borderRadius: '4px',
        textDecoration: 'none',
      }}
    >
      &larr; Back to Studio
    </Link>
  )
}
