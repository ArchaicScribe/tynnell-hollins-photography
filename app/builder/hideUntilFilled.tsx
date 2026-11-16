import type { ReactElement, ReactNode } from 'react'

// The "Hide until filled in" switch shared by every block that can hide. It is
// OFF on every existing block, so saved pages render exactly as before; the
// Home page and the `home` template turn it on.
export const hideUntilFilledField = {
  type: 'radio' as const,
  label: 'Hide until filled in',
  options: [
    { label: 'Off', value: false },
    { label: 'On', value: true },
  ],
}

// With the switch on and nothing filled in: visitors see nothing at all (no
// padding either, because the whole block is skipped), while the editor shows a
// dashed outline so Tynnell can still find the section and fill it in.
export function GateEmpty({
  hide,
  empty,
  editing,
  label,
  children,
}: {
  hide?: boolean
  empty: boolean
  editing?: boolean
  label: string
  children: ReactNode
}): ReactElement | null {
  if (!hide || !empty) return <>{children}</>
  if (!editing) return null
  return (
    <div
      data-empty-outline=""
      style={{
        margin: '1rem clamp(1.25rem, 5vw, 5rem)',
        padding: '1.5rem',
        border: '2px dashed var(--color-detail, #9B9A9A)',
        color: 'var(--color-detail, #9B9A9A)',
        fontFamily: 'var(--font-body, sans-serif)',
        fontSize: '0.8rem',
        letterSpacing: '0.08em',
        textAlign: 'center',
      }}
    >
      Add your words here: {label}
    </div>
  )
}
