'use client'

// This component exists solely to force Payload's base stylesheet into the
// client bundle. CSS imported in a 'use client' module is extracted into a
// static <link> tag by Next.js and is loaded independently of RSC streaming.
// That means it survives React hydration failures, the admin never goes
// fully unstyled even if error #418 causes a client-side re-render fallback.
//
// It renders nothing. Drop it anywhere in the admin layout tree.

import '@payloadcms/next/css'

export function PayloadCssGuard() {
  return null
}
