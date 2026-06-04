import type { Metadata } from 'next'
import './globals.css'
import './styles/tokens.css'
import Navbar from '../components/Navbar/Navbar'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  metadataBase: new URL('https://tynnellhollinsphotography.com'),
  title: {
    default: 'Tynnell Hollins Photography',
    template: '%s | Tynnell Hollins Photography',
  },
  description:
    'Tynnell Hollins is a wedding and portrait photographer capturing authentic moments for couples and families.',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tangerine:wght@400;700&family=Archivo:wght@400;500;600&family=Roboto+Mono:wght@300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}