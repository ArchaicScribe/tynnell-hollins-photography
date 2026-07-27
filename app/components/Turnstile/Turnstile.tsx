'use client'
import { useEffect, useRef, useId } from 'react'

// TYN-357: minimal Cloudflare Turnstile wrapper - loads the widget script
// once (shared across every mount) and renders a widget bound to `siteKey`,
// reporting the verification token back via `onVerify`. Only ever rendered
// by callers when a site key is actually configured (see ContactForm.tsx),
// so this component doesn't need its own "not configured" fallback.
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
    }
  }
}

let scriptLoadPromise: Promise<void> | null = null
function loadTurnstileScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise
  scriptLoadPromise = new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Turnstile script'))
    document.head.appendChild(script)
  })
  return scriptLoadPromise
}

export default function Turnstile({
  siteKey,
  onVerify,
}: {
  siteKey: string
  onVerify: (token: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const id = useId()

  useEffect(() => {
    let cancelled = false
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onVerify(token),
          'expired-callback': () => onVerify(''),
          'error-callback': () => onVerify(''),
        })
      })
      .catch((e) => console.error('[turnstile]', e))
    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey])

  return <div ref={containerRef} id={`turnstile-${id}`} />
}
