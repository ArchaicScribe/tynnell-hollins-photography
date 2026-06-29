'use client'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Props = { slug: string; title: string }

export function GalleryPasswordGate({ slug, title }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/gallery-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, password }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg, #0C0C0C)',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}>
        <div style={{
          fontSize: '2rem',
          marginBottom: '1.5rem',
          opacity: 0.35,
          color: 'var(--color-detail, #9B9A9A)',
        }} aria-hidden="true">&#128274;</div>

        <h1 style={{
          fontFamily: 'var(--font-display, Tangerine, serif)',
          fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
          fontWeight: 400,
          color: 'var(--color-heading, #D6D1CE)',
          margin: '0 0 0.5rem',
          letterSpacing: '0.02em',
          lineHeight: 1.2,
        }}>
          Private Gallery
        </h1>

        <p style={{
          fontFamily: 'var(--font-heading, Archivo, sans-serif)',
          fontSize: '0.88rem',
          color: 'var(--color-detail, #9B9A9A)',
          margin: '0 0 2rem',
          lineHeight: 1.6,
        }}>
          Enter the password to view <em style={{ color: 'var(--color-body, #E6E1DE)', fontStyle: 'normal' }}>{title}</em>.
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            required
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              padding: '0.75rem 1rem',
              color: 'var(--color-body, #E6E1DE)',
              fontFamily: 'var(--font-body, "Roboto Mono", monospace)',
              fontSize: '0.9rem',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
              textAlign: 'center',
              letterSpacing: '0.1em',
            }}
          />

          {error && (
            <p role="alert" style={{
              fontFamily: 'var(--font-heading, Archivo, sans-serif)',
              fontSize: '0.78rem',
              color: '#f0a3a3',
              margin: 0,
            }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            style={{
              background: 'var(--color-btn-bg, #9B9A9A)',
              border: 'none',
              color: '#0C0C0C',
              borderRadius: 6,
              padding: '0.75rem 2rem',
              fontFamily: 'var(--font-heading, Archivo, sans-serif)',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: (loading || !password.trim()) ? 'not-allowed' : 'pointer',
              opacity: (loading || !password.trim()) ? 0.45 : 1,
              transition: 'opacity .15s',
              width: '100%',
            }}
          >
            {loading ? 'Checking...' : 'View Gallery'}
          </button>
        </form>

        <Link href="/portfolio" style={{
          display: 'inline-block',
          marginTop: '1.75rem',
          fontFamily: 'var(--font-heading, Archivo, sans-serif)',
          fontSize: '0.75rem',
          color: 'var(--color-detail, #9B9A9A)',
          textDecoration: 'none',
          letterSpacing: '0.05em',
        }}>
          &#8592; Back to Portfolio
        </Link>
      </div>
    </main>
  )
}
