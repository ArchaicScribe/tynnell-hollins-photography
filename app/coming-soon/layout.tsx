import { tangerine, archivo, robotoMono } from '@/app/fonts/fonts'
import '../(site)/globals.css'
import '../(site)/styles/tokens.css'

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${tangerine.variable} ${archivo.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
