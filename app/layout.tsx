import type { Metadata } from 'next'
import './globals.css'
import './styles/tokens.css'
import Navbar from './components/Navbar/Navbar'
import { SanityLive } from '@/sanity/lib/live'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'Tynnell Hollins Photography',
  description: 'Documentary wedding and portrait photographer.',
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
        <SanityLive />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}