import Link from 'next/link'

export function GalleryExpiredNotice() {
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
        }} aria-hidden="true">&#8987;</div>

        <h1 style={{
          fontFamily: 'var(--font-display, Tangerine, serif)',
          fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
          fontWeight: 400,
          color: 'var(--color-heading, #D6D1CE)',
          margin: '0 0 0.5rem',
          letterSpacing: '0.02em',
          lineHeight: 1.2,
        }}>
          Gallery Expired
        </h1>

        <p style={{
          fontFamily: 'var(--font-heading, Archivo, sans-serif)',
          fontSize: '0.88rem',
          color: 'var(--color-detail, #9B9A9A)',
          margin: '0 0 2rem',
          lineHeight: 1.6,
        }}>
          This gallery is no longer available. Reach out if you&apos;d like access extended.
        </p>

        <Link href="/contact" style={{
          display: 'inline-block',
          background: 'var(--color-btn-bg, #9B9A9A)',
          color: '#0C0C0C',
          borderRadius: 6,
          padding: '0.75rem 2rem',
          fontFamily: 'var(--font-heading, Archivo, sans-serif)',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textDecoration: 'none',
        }}>
          Get in Touch
        </Link>

        <div>
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
      </div>
    </main>
  )
}
