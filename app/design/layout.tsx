import type { ReactNode } from 'react'

// Standalone root layout for /design (TYN-314), same pattern as the other
// custom Studio routes (photo-library, studio, builder) that live outside
// the (site)/(payload) route groups and so need their own <html>/<body>.
// The editor's own chrome uses a plain system font stack (set inline in
// DesignClient); the live-preview iframe loads the real (site) layout (and
// its fonts) independently inside its own document.
export default function DesignLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
