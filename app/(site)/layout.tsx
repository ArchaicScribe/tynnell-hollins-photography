import type { Metadata, Viewport } from 'next'
import {
  tangerine,
  poppinsHeading,
  poppinsBody,
  abrilFatface,
  cormorant,
  barlow,
  jost,
  parisienne,
} from '@/app/fonts/fonts'
import './globals.css'
import './styles/tokens.css'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import { getBuilderNavLinks } from '@/app/lib/nav'
import { getSiteDesign, themeToCssVars } from '@/app/lib/siteDesign'
import { DesignPreviewBridge } from '../components/DesignPreviewBridge'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

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
      className={`${tangerine.variable} ${poppinsHeading.variable} ${poppinsBody.variable} ${abrilFatface.variable} ${cormorant.variable} ${barlow.variable} ${jost.variable} ${parisienne.variable}`}
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