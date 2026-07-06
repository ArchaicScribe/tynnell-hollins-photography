'use client'
import { useState, useEffect, useRef } from 'react'

const ui = "'Archivo', system-ui, sans-serif"

export function InviteUserModal() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const close = () => {
    setOpen(false)
    setName('')
    setEmail('')
    setError('')
    setSuccess(false)
    triggerRef.current?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/admin/invite-user', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data?.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', padding: '0.35rem 0',
          fontSize: '0.84rem', color: '#9b9a9a', background: 'transparent', border: 'none',
          textDecoration: 'none', fontFamily: ui, cursor: 'pointer', textAlign: 'left',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e6e1de' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
      >
        + Invite User
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-user-heading"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            background: '#1a1a1a', border: '1px solid rgba(155,154,154,0.15)', borderRadius: '6px',
            width: 'min(92vw, 420px)', padding: '1.5rem',
          }}>
            {success ? (
              <>
                <h2 id="invite-user-heading" style={{ margin: '0 0 0.75rem', fontFamily: ui, fontSize: '1.05rem', fontWeight: 600, color: '#d6d1ce' }}>
                  Invite sent
                </h2>
                <p style={{ margin: '0 0 1.25rem', fontFamily: ui, fontSize: '0.85rem', color: '#9b9a9a', lineHeight: 1.5 }}>
                  {name} will receive an email at {email} with a temporary password and login link.
                </p>
                <button
                  type="button"
                  onClick={close}
                  style={{
                    width: '100%', padding: '0.55rem', fontFamily: ui, fontSize: '0.85rem', fontWeight: 600,
                    background: 'rgba(155,154,154,0.18)', border: '1px solid rgba(155,154,154,0.35)',
                    borderRadius: '4px', color: '#d6d1ce', cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 id="invite-user-heading" style={{ margin: '0 0 0.75rem', fontFamily: ui, fontSize: '1.05rem', fontWeight: 600, color: '#d6d1ce' }}>
                  Invite a new user
                </h2>
                <p style={{ margin: '0 0 1.25rem', fontFamily: ui, fontSize: '0.8rem', color: '#9b9a9a', lineHeight: 1.5 }}>
                  They&apos;ll get an email with a temporary password and be asked to set their own on first login.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontFamily: ui, fontSize: '0.72rem', color: '#6b6a6a' }}>Full name</span>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={name}
                      onChange={e => setName(e.target.value)}
                      style={{ background: '#262626', border: '1px solid rgba(155,154,154,0.2)', borderRadius: '4px', padding: '0.5rem 0.7rem', color: '#e6e1de', fontSize: '0.875rem', outline: 'none', fontFamily: ui }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontFamily: ui, fontSize: '0.72rem', color: '#6b6a6a' }}>Email</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{ background: '#262626', border: '1px solid rgba(155,154,154,0.2)', borderRadius: '4px', padding: '0.5rem 0.7rem', color: '#e6e1de', fontSize: '0.875rem', outline: 'none', fontFamily: ui }}
                    />
                  </label>
                  {error && (
                    <p role="alert" style={{ margin: 0, fontFamily: ui, fontSize: '0.78rem', color: '#f0a3a3' }}>{error}</p>
                  )}
                  <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={close}
                      style={{
                        flex: 1, padding: '0.55rem', fontFamily: ui, fontSize: '0.85rem',
                        background: 'transparent', border: '1px solid rgba(155,154,154,0.25)',
                        borderRadius: '4px', color: '#9b9a9a', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sending}
                      aria-busy={sending}
                      style={{
                        flex: 1, padding: '0.55rem', fontFamily: ui, fontSize: '0.85rem', fontWeight: 600,
                        background: sending ? 'rgba(155,154,154,0.15)' : 'rgba(155,154,154,0.18)',
                        border: '1px solid rgba(155,154,154,0.35)', borderRadius: '4px',
                        color: '#d6d1ce', cursor: sending ? 'default' : 'pointer',
                      }}
                    >
                      {sending ? 'Sending...' : 'Send Invite'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
