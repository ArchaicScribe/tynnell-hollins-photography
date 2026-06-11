import type { ReactNode } from 'react'
import { Archivo, Roboto_Mono } from 'next/font/google'

// Root layout for the public render of the Puck-built page (TYN-214 POC).
const archivo = Archivo({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-heading', display: 'swap' })
const robotoMono = Roboto_Mono({ weight: ['300', '400'], subsets: ['latin'], variable: '--font-body', display: 'swap' })

export const metadata = { title: 'Landing' }

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${robotoMono.variable}`}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
