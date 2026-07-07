import type { Metadata, Viewport } from 'next'
import { Tangerine, Poppins, Abril_Fatface } from 'next/font/google'
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

// Poppins matches the Pixieset builder's typeface. Used for both headings and
// body copy (two loader instances so each gets its own CSS variable), keeping
// the site's typography uniform outside of the Tangerine/Abril script accents.
const poppinsHeading = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const poppinsBody = Poppins({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const abrialFatface = Abril_Fatface({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-display-bold',
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
    <html lang="en" className={`${tangerine.variable} ${poppinsHeading.variable} ${poppinsBody.variable} ${abrialFatface.variable}`}>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skipLink">Skip to content</a>
        <Navbar builderLinks={builderLinks} />
        <div id="main-content" tabIndex={-1}>{children}</div>
        <Footer />
        {/* No consent gate (TYN-27, investigated): Vercel Web Analytics and Speed
            Insights are cookieless by design - no persistent identifiers, no
            cross-site tracking, no PII collected - so no GDPR consent banner
            is required for this specific tooling. Revisit if any future
            analytics tool is added that does use cookies/fingerprinting. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}