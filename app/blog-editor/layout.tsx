import type { ReactNode } from 'react'
// Same fonts + design tokens as app/(site)/layout.tsx - not app/builder's
// Archivo/Roboto Mono setup. The whole point of this editor is that its canvas
// IS the real blog post, so it needs the site's actual typography (Tangerine
// display, Poppins body/heading), not the page builder's separate brand.
import { tangerine, poppinsHeading, poppinsBody, abrilFatface } from '@/app/fonts/fonts'
import '../(site)/styles/tokens.css'

export const metadata = { title: 'Blog Editor' }

// Chrome-free root layout (no site nav/footer) - same top-level-route pattern
// as app/builder/layout.tsx and app/photo-library/layout.tsx.
export default function BlogEditorLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${tangerine.variable} ${poppinsHeading.variable} ${poppinsBody.variable} ${abrilFatface.variable}`}>
      <body style={{ margin: 0, background: 'var(--color-bg)' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
