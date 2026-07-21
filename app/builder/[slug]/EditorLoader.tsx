'use client'

import dynamic from 'next/dynamic'
import type { Data } from '@measured/puck'

// Lazy-load the heavy Puck editor (TYN-218). The route shell paints instantly
// with a clean loading state, then the editor bundle loads client-side, so the
// builder feels responsive instead of blocking on a large bundle. ssr:false is
// required (Puck is client-only) and must live in a client component.
const LoadingShell = () => (
  <div
    style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#131313',
      color: '#9b9a9a',
      fontFamily: "var(--font-body, 'Roboto Mono', monospace)",
      fontSize: '0.85rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    }}
  >
    Loading editor...
  </div>
)

const EditorClient = dynamic(() => import('./EditorClient').then((m) => m.EditorClient), {
  ssr: false,
  loading: () => <LoadingShell />,
})

export function EditorLoader(props: { slug: string; title: string; published: boolean; initialData: Data; promotedRoute: string | null }) {
  return <EditorClient {...props} />
}
