import type { ReactNode } from 'react'

// Standalone root layout for /site-settings (TYN-313), same pattern as
// /design and the other custom Studio routes that live outside the
// (site)/(payload) route groups and so need their own <html>/<body>.
export default function SiteSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
