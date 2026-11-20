'use client'

import { useRef, useState } from 'react'

// "Apply to all photos" (/design > Texture). The photo colour treatment is baked
// into each photo's web renditions when the photo is processed (see
// app/lib/photoFinish.ts), so photos uploaded before a change keep their old look
// until they are reprocessed. This rebuilds every photo's sizes from its original
// through the existing admin route, one photo per request so each stays well inside
// the serverless time limit. Originals are never altered.

type State =
  | { phase: 'idle' }
  | { phase: 'listing' }
  | { phase: 'working'; index: number; total: number }
  | { phase: 'done'; ok: number; total: number; failures: string[] }
  | { phase: 'error'; message: string }

// `blocked` is set while the /design draft has changes that are not published yet:
// the server reads the PUBLISHED setting, so applying now would bake the old one.
export function ApplyPhotoTreatment({ blocked = false }: { blocked?: boolean }) {
  const [state, setState] = useState<State>({ phase: 'idle' })
  const running = useRef(false)
  const busy = state.phase === 'listing' || state.phase === 'working'

  async function run() {
    // A ref, not the disabled button: two clicks can land before React re-renders.
    if (running.current) return
    running.current = true
    try {
      await runAll()
    } finally {
      running.current = false
    }
  }

  async function runAll() {
    setState({ phase: 'listing' })
    let ids: (number | string)[]
    try {
      const res = await fetch('/api/photos?limit=0&depth=0&select[id]=true')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { docs?: { id: number | string }[] }
      ids = (data.docs ?? []).map((d) => d.id)
    } catch {
      setState({ phase: 'error', message: 'Could not list your photos. Sign in again and retry.' })
      return
    }

    let ok = 0
    const failures: string[] = []
    for (let i = 0; i < ids.length; i++) {
      setState({ phase: 'working', index: i + 1, total: ids.length })
      try {
        const res = await fetch('/api/admin/regenerate-photo-sizes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: ids[i] }),
        })
        if (res.ok) ok++
        else {
          const detail = ((await res.json().catch(() => ({}))) as { error?: string }).error ?? `HTTP ${res.status}`
          failures.push(`Photo ${ids[i]} failed: ${detail}`)
        }
      } catch (err) {
        failures.push(`Photo ${ids[i]} failed: ${err instanceof Error ? err.message : 'network error'}`)
      }
    }
    setState({ phase: 'done', ok, total: ids.length, failures })
  }

  return (
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        onClick={run}
        disabled={busy || blocked}
        style={{
          background: '#1a1a1a',
          color: '#e6e1de',
          border: '1px solid #2a2a2a',
          borderRadius: 5,
          padding: '8px 12px',
          fontSize: 12,
          cursor: busy || blocked ? 'default' : 'pointer',
          opacity: busy || blocked ? 0.6 : 1,
        }}
      >
        Apply to all photos
      </button>
      {blocked && (
        <p style={{ color: '#c9a45c', fontSize: 11, marginTop: 8 }}>
          Publish your changes first. Apply uses your published setting, not the one on screen.
        </p>
      )}
      <div aria-live="polite" style={{ color: '#9b9a9a', fontSize: 11, marginTop: 8 }}>
        {state.phase === 'listing' && <p>Finding your photos...</p>}
        {state.phase === 'working' && <p>Processing photo {state.index} of {state.total}...</p>}
        {state.phase === 'done' && <p>Done: {state.ok} of {state.total} photos.</p>}
        {state.phase === 'done' && state.failures.map((f) => <p key={f} style={{ color: '#c87171' }}>{f}</p>)}
        {state.phase === 'error' && <p style={{ color: '#c87171' }}>{state.message}</p>}
      </div>
    </div>
  )
}
