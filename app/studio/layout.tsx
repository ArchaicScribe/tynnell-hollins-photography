import type { ReactNode } from 'react'
import { archivo, robotoMono } from '@/app/fonts/fonts'
import '../(site)/styles/tokens.css'

export const metadata = { title: 'Studio Dashboard' }

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${robotoMono.variable}`}>
      <body style={{ margin: 0, background: '#111', color: '#e6e1de' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
