'use client'

export default function SiteError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '4rem max(1.25rem, 2.5vw)',
        background: 'var(--color-bg)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.65rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'var(--color-detail)',
          marginBottom: '1.5rem',
        }}
      >
        Something went wrong
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(3rem, 8vw, 6rem)',
          fontWeight: 400,
          color: 'var(--color-heading)',
          lineHeight: 1.05,
          marginBottom: '1.25rem',
        }}
      >
        Missed the Shot
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.82rem',
          color: 'var(--color-detail)',
          letterSpacing: '0.05em',
          marginBottom: '3rem',
          maxWidth: '380px',
        }}
      >
        An unexpected error occurred. Try again or head back home.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.65rem 1.75rem',
            background: 'var(--color-btn-bg)',
            color: 'var(--color-bg)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.68rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
        <a
          href="/"
          style={{
            padding: '0.65rem 1.75rem',
            background: 'transparent',
            color: 'var(--color-detail)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.68rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            border: '1px solid rgba(155, 154, 154, 0.3)',
            borderRadius: '2px',
          }}
        >
          Back to Home
        </a>
      </div>
    </main>
  )
}
