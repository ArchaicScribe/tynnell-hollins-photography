'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: '#0C0C0C',
          color: '#D6D1CE',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '4rem 1.25rem',
          }}
        >
          <p
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#9B9A9A',
              marginBottom: '1.5rem',
            }}
          >
            Something went wrong
          </p>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              fontWeight: 400,
              lineHeight: 1.05,
              marginBottom: '1.25rem',
            }}
          >
            Missed the Shot
          </h1>
          <p
            style={{
              fontSize: '0.85rem',
              color: '#9B9A9A',
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
                background: '#9B9A9A',
                color: '#0C0C0C',
                fontSize: '0.68rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                padding: '0.65rem 1.75rem',
                background: 'transparent',
                color: '#9B9A9A',
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
      </body>
    </html>
  )
}
