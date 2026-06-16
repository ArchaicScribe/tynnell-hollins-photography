import type { ReactNode } from 'react'
import { Archivo, Roboto_Mono } from 'next/font/google'
// Design tokens (incl. the shared --tape-* vars) so the Puck editor's taped
// Photo Gallery preview resolves them, matching the public render (TYN-230).
import '../(site)/styles/tokens.css'

// Root layout for the full-screen Puck editor (TYN-214 POC). Top-level routes
// each need their own root layout; the editor is intentionally chrome-free
// (no site nav/footer) so Puck owns the whole viewport.
const archivo = Archivo({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-heading', display: 'swap' })
const robotoMono = Roboto_Mono({ weight: ['300', '400'], subsets: ['latin'], variable: '--font-body', display: 'swap' })

export const metadata = { title: 'Page Builder' }

export default function BuilderLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${robotoMono.variable}`}>
      <body className="puck-dark" style={{ margin: 0 }} suppressHydrationWarning>{children}</body>
    </html>
  )
}
