import type { Metadata, Viewport } from 'next'
import { Tangerine, Archivo, Roboto_Mono, Abril_Fatface } from 'next/font/google'
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
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const abrialFatface = Abril_Fatface({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-display-bold',
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
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tynnell Hollins Photography' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#0C0C0C',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const builderLinks = await getBuilderNavLinks()

  return (
    <html lang="en" className={`${tangerine.variable} ${archivo.variable} ${robotoMono.variable} ${abrialFatface.variable}`}>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skipLink">Skip to content</a>
        <Navbar builderLinks={builderLinks} />
        <div id="main-content" tabIndex={-1}>{children}</div>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}