import { Tangerine, Archivo, Roboto_Mono } from 'next/font/google'
import '../(site)/globals.css'
import '../(site)/styles/tokens.css'

const tangerine = Tangerine({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const archivo = Archivo({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const robotoMono = Roboto_Mono({
  weight: ['300', '400'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${tangerine.variable} ${archivo.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
