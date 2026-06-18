'use client'
import { useAuth } from '@payloadcms/ui'
import { useState, type ReactNode } from 'react'

export function ForcePasswordChange({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || !(user as any).mustChangePassword) return <>{children}</>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${user!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password, mustChangePassword: false }),
      })
      if (!res.ok) throw new Error('Server error')
      window.location.reload()
    } catch {
      setError('Failed to update password. Please try again.')
      setSaving(false)
    }
  }

  return (
    <>
      {children}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="force-pw-heading"
        style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(12,12,12,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
        <div style={{
          background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
          padding: '2.5rem', width: '100%', maxWidth: 400,
          fontFamily: 'var(--font-body, monospace)',
        }}>
          <h2 id="force-pw-heading" style={{ margin: '0 0 0.5rem', color: '#D6D1CE', fontSize: '1.25rem', fontWeight: 600 }}>
            Set your password
          </h2>
          <p style={{ margin: '0 0 1.5rem', color: '#9B9A9A', fontSize: '0.875rem', lineHeight: 1.5 }}>
            Welcome! Please choose a personal password to continue.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label htmlFor="force-pw-new" style={{ color: '#B8B4B1', fontSize: '0.8125rem' }}>New password</label>
              <input
                id="force-pw-new"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
                style={{
                  background: '#262626', border: '1px solid #333', borderRadius: 4,
                  color: '#D6D1CE', padding: '0.5rem 0.75rem', fontSize: '0.9375rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label htmlFor="force-pw-confirm" style={{ color: '#B8B4B1', fontSize: '0.8125rem' }}>Confirm password</label>
              <input
                id="force-pw-confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                style={{
                  background: '#262626', border: '1px solid #333', borderRadius: 4,
                  color: '#D6D1CE', padding: '0.5rem 0.75rem', fontSize: '0.9375rem',
                }}
              />
            </div>
            {error && (
              <p role="alert" style={{ margin: 0, color: '#e57373', fontSize: '0.8125rem' }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              style={{
                marginTop: '0.25rem',
                background: saving ? '#555' : '#9B9A9A',
                color: '#0C0C0C', border: 'none', borderRadius: 4,
                padding: '0.625rem', fontSize: '0.9375rem', fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Set password'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
