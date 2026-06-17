import type { Metadata } from 'next'
import { Tangerine, Archivo, Roboto_Mono } from 'next/font/google'
import './globals.css'
import './styles/tokens.css'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import { getBuilderNavLinks } from '@/app/lib/nav'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

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

export const metadata: Metadata = {
  metadataBase: new URL('https://tynnellhollinsphotography.com'),
  title: {
    default: 'Tynnell Hollins Photography',
    template: '%s | Tynnell Hollins Photography',
  },
  description:
    'Albuquerque, New Mexico wedding and portrait photographer. Tynnell Hollins captures authentic, timeless moments for couples, families, and engagements.',
  openGraph: {
    type: 'website',
    siteName: 'Tynnell Hollins Photography',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const builderLinks = await getBuilderNavLinks()

  return (
    <html lang="en" className={`${tangerine.variable} ${archivo.variable} ${robotoMono.variable}`}>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skipLink">Skip to content</a>
        <Navbar builderLinks={builderLinks} />
        <div id="main-content">{children}</div>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}