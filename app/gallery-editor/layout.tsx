import type { ReactNode } from 'react'
import { Archivo, Roboto_Mono } from 'next/font/google'
import '../(site)/styles/tokens.css'

const archivo = Archivo({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-heading', display: 'swap' })
const robotoMono = Roboto_Mono({ weight: ['300', '400'], subsets: ['latin'], variable: '--font-body', display: 'swap' })

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
