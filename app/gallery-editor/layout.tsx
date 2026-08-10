import type { ReactNode } from 'react'
import { archivo, robotoMono } from '@/app/fonts/fonts'
import '../(site)/styles/tokens.css'

export const metadata = { title: 'Gallery Editor' }

export default function GalleryEditorLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${robotoMono.variable}`}>
      <body style={{ margin: 0, background: '#0c0c0c', color: '#e6e1de' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
