'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { InviteUserModal } from './InviteUserModal'

type UserDoc = {
  id: number
  email: string
  name?: string | null
  mustChangePassword?: boolean | null
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
  heading: {
    fontSize: '1.1rem',
    fontWeight: 600,
    fontFamily: 'Archivo, sans-serif',
    color: 'var(--theme-text, #e6e1de)',
    margin: 0,
  } as React.CSSProperties,
  count: {
    fontSize: '0.8rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  inviteWrap: {
    marginLeft: 'auto',
    padding: '0.4rem 0.9rem',
    background: 'var(--theme-success-500, #10B981)',
    borderRadius: '4px',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  } as React.CSSProperties,
  card: {
    background: 'var(--theme-elevation-100, #131313)',
    borderRadius: '6px',
    textDecoration: 'none',
    color: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    border: '1px solid var(--theme-elevation-200, #1a1a1a)',
    transition: 'border-color 0.15s, transform 0.15s',
    padding: '1rem',
  } as React.CSSProperties,
  avatar: {
    flexShrink: 0,
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#1db48e,#0d9488)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#fff',
    fontFamily: 'Archivo, sans-serif',
  } as React.CSSProperties,
  name: {
    fontSize: '0.88rem',
    fontWeight: 600,
    fontFamily: 'Archivo, sans-serif',
    color: 'var(--theme-text, #e6e1de)',
    lineHeight: 1.3,
  } as React.CSSProperties,
  email: {
    fontSize: '0.76rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    marginTop: '0.15rem',
  } as React.CSSProperties,
  badge: {
    marginTop: '0.4rem',
    display: 'inline-block',
    padding: '0.1rem 0.4rem',
    background: 'rgba(251,146,60,0.12)',
    border: '1px solid rgba(251,146,60,0.3)',
    borderRadius: '3px',
    fontSize: '0.58rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: '#fb923c',
    fontWeight: 500,
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: '4rem 2rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  skeleton: {
    background: 'var(--theme-elevation-200, #1a1a1a)',
    borderRadius: '6px',
    height: '74px',
    animation: 'pulse 1.5s infinite',
  } as React.CSSProperties,
}

function initialsOf(user: UserDoc): string {
  if (user.name) return user.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  return user.email[0]?.toUpperCase() ?? '?'
}

export function UsersGridView() {
  const [users, setUsers] = useState<UserDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    fetch('/api/users?limit=100&depth=0&sort=email', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then(data => {
        setUsers(data.docs ?? [])
        setLoading(false)
      })
      .catch(() => { setLoading(false); setLoadError("Couldn't load users. Check your connection and try again.") })
  }, [])

  return (
    <div style={css.root}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .user-card:hover { border-color: var(--theme-elevation-400, #3a3a3a) !important; transform: translateY(-2px); }
      `}</style>

      <div style={css.toolbar}>
        <h1 style={css.heading}>Users</h1>
        {!loading && (
          <span style={css.count}>
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </span>
        )}
        <div style={css.inviteWrap}>
          <InviteUserModal />
        </div>
      </div>

      {loadError && (
        <div role="alert" style={{ marginBottom: '0.75rem', padding: '0.55rem 0.75rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 4, fontSize: '0.8rem', color: '#f0a3a3' }}>
          {loadError}
        </div>
      )}

      {loading ? (
        <div style={css.grid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={css.skeleton} />
          ))}
        </div>
      ) : loadError ? null : users.length === 0 ? (
        <div style={css.empty}>No users yet.</div>
      ) : (
        <div style={css.grid}>
          {users.map(u => (
            <Link
              key={u.id}
              href={`/admin/collections/users/${u.id}`}
              style={css.card}
              className="user-card"
              title={u.name ?? u.email}
            >
              <div style={css.avatar}>{initialsOf(u)}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={css.name}>{u.name || '<No Full Name>'}</div>
                <div style={css.email}>{u.email}</div>
                {u.mustChangePassword && (
                  <span style={css.badge}>Password reset pending</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
