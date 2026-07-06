import type { ReactNode } from 'react'
import { Tangerine, Poppins, Abril_Fatface } from 'next/font/google'
// Same font loaders + design tokens as app/(site)/layout.tsx - not
// app/builder's Archivo/Roboto Mono setup. The whole point of this editor is
// that its canvas IS the real blog post, so it needs the site's actual
// typography (Tangerine display, Poppins body/heading), not the page
// builder's separate brand.
import '../(site)/styles/tokens.css'

const tangerine = Tangerine({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const poppinsHeading = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const poppinsBody = Poppins({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const abrilFatface = Abril_Fatface({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-display-bold',
  display: 'swap',
})

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
