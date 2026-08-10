import type { Metadata, Viewport } from 'next'
import {
  Tangerine,
  Poppins,
  Abril_Fatface,
  Cormorant_Garamond,
  Barlow,
  Jost,
  Parisienne,
} from 'next/font/google'
import './globals.css'
import './styles/tokens.css'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import { getBuilderNavLinks } from '@/app/lib/nav'
import { getSiteDesign, themeToCssVars } from '@/app/lib/siteDesign'
import { DesignPreviewBridge } from '../components/DesignPreviewBridge'
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

// Rising Roots type system. The reference template uses NyghtSerif Light (+
// its italic) and Nostalgia for the script, both commercially licensed, so
// they are deliberately NOT embedded here. Barlow and Jost are exactly what
// the reference uses and are OFL-licensed; Cormorant Garamond stands in for
// NyghtSerif (very close at light weight, and the face Tynnell already chose
// in her own Showit draft), and Parisienne stands in for the script.
// Italic is loaded explicitly because the accent role is an italic serif.
const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const barlow = Barlow({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jost = Jost({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-label',
  display: 'swap',
})

const parisienne = Parisienne({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-script',
  display: 'swap',
})

// Favicon (TYN-321) is the one piece of metadata that depends on the
// SiteDesign global, so this can't stay a static `metadata` export - Next.js
// only allows one or the other per layout. getSiteDesign() is wrapped in
// React's cache(), so this and the layout body's own call share one DB read.
export async function generateMetadata(): Promise<Metadata> {
  const theme = await getSiteDesign()
  return {
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
    // Falls back to the app/favicon.ico file convention when no custom
    // favicon has been set - only override when a real value exists.
    ...(theme.faviconUrl ? { icons: { icon: theme.faviconUrl } } : {}),
  }
}

export const viewport: Viewport = {
  themeColor: '#0C0C0C',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [builderLinks, theme] = await Promise.all([getBuilderNavLinks(), getSiteDesign()])

  return (
    <html
      lang="en"
      className={`${tangerine.variable} ${poppinsHeading.variable} ${poppinsBody.variable} ${abrialFatface.variable} ${cormorant.variable} ${barlow.variable} ${jost.variable} ${parisienne.variable}`}
      data-animations={theme.animationsEnabled ? undefined : 'off'}
    >
      {/* Site-wide theme (TYN-314), read fresh on every request from the
          Design editor's saved settings - layers on top of tokens.css's
          hardcoded defaults so an unsaved/missing global never breaks
          styling (getSiteDesign falls back to those same defaults). */}
      <style dangerouslySetInnerHTML={{ __html: `:root {\n  ${themeToCssVars(theme)}\n}` }} />
      <body suppressHydrationWarning>
        <a href="#main-content" className="skipLink">Skip to content</a>
        <Navbar builderLinks={builderLinks} logoUrl={theme.logoUrl} />
        <div id="main-content" tabIndex={-1}>{children}</div>
        <Footer />
        <DesignPreviewBridge />
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