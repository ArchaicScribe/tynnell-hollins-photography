'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Per-page placement toggles for the builder list (TYN-226 / TYN-227):
// "In menu" adds the page to the public site navigation, "Homepage" makes it
// render at "/". Both PATCH via /api/builder/settings and refresh the list.
export function PagePlacementToggles({
  id,
  showInNav,
  isHomepage,
  published,
}: {
  id: number | string
  showInNav: boolean
  isHomepage: boolean
  published: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<null | 'nav' | 'home'>(null)

  const update = async (flag: 'nav' | 'home', value: boolean) => {
    setBusy(flag)
    try {
      await fetch('/api/builder/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(flag === 'nav' ? { id, showInNav: value } : { id, isHomepage: value }),
      })
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  const pill = (active: boolean, loading: boolean): React.CSSProperties => ({
    cursor: loading ? 'default' : 'pointer',
    fontSize: '0.72rem',
    letterSpacing: '0.02em',
    padding: '0.3rem 0.6rem',
    borderRadius: 4,
    lineHeight: 1,
    opacity: loading ? 0.5 : 1,
    border: active ? '1px solid #d6d1ce' : '1px dashed rgba(155,154,154,0.4)',
    background: active ? '#d6d1ce' : 'transparent',
    color: active ? '#0c0c0c' : '#9b9a9a',
    fontWeight: active ? 600 : 400,
  })

  return (
    <span style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => update('nav', !showInNav)}
        disabled={busy !== null}
        aria-pressed={showInNav}
        aria-busy={busy === 'nav'}
        style={pill(showInNav, busy === 'nav')}
        title={
          showInNav
            ? published
              ? 'Showing in the site menu'
              : 'Will show in the menu once this page is published'
            : 'Add this page to the site menu'
        }
      >
        {showInNav ? <><span aria-hidden="true">✓ </span>In menu</> : 'In menu'}
      </button>
      <button
        type="button"
        onClick={() => update('home', !isHomepage)}
        disabled={busy !== null}
        aria-pressed={isHomepage}
        aria-busy={busy === 'home'}
        style={pill(isHomepage, busy === 'home')}
        title={
          isHomepage
            ? published
              ? 'This page is the site homepage'
              : 'Will become the homepage once this page is published'
            : 'Use this page as the site homepage'
        }
      >
        {isHomepage ? <><span aria-hidden="true">★ </span>Homepage</> : 'Homepage'}
      </button>
    </span>
  )
}
