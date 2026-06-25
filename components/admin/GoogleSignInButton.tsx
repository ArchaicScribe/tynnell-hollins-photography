'use client'

// Rendered by Payload's beforeLogin slot - appears above the email/password form
export function GoogleSignInButton() {
  const ssoError =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('sso_error')
      : null

  const errorMessages: Record<string, string> = {
    unauthorized: 'That Google account is not authorized to access this admin.',
    user_not_found: 'No admin account found for that Google email.',
    invalid_token: 'Google sign-in failed. Please try again.',
    token_exchange_failed: 'Could not reach Google. Please try again.',
    invalid_state: 'Sign-in was interrupted. Please try again.',
    server_error: 'Something went wrong. Please try again.',
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {ssoError && (
        <p
          role="alert"
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: 'rgba(220, 38, 38, 0.12)',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            borderRadius: '3px',
            color: '#fca5a5',
            fontSize: '0.8125rem',
            fontFamily: 'var(--font-body, sans-serif)',
            lineHeight: '1.5',
          }}
        >
          {errorMessages[ssoError] ?? errorMessages.server_error}
        </p>
      )}

      <a
        href="/api/auth/google"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.625rem',
          width: '100%',
          padding: '0.75rem 1rem',
          background: '#fff',
          color: '#1f1f1f',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-body, sans-serif)',
          fontWeight: 500,
          textDecoration: 'none',
          borderRadius: '3px',
          border: '1px solid #e0e0e0',
          transition: 'background 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.background = '#f5f5f5'
          el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.background = '#fff'
          el.style.boxShadow = 'none'
        }}
      >
        <GoogleLogo />
        Sign in with Google
      </a>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          margin: '1.25rem 0 0',
        }}
      >
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
        <span
          style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-body, sans-serif)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          or sign in with email
        </span>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
      </div>
    </div>
  )
}

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}
