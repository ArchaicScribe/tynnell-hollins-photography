import { describe, it, expect, vi } from 'vitest'
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'

// The layout's data loaders and heavy children are stubbed so the test sees
// only the document shell the layout itself returns.
vi.mock('@/app/fonts/fonts', () => {
  const face = (name: string) => ({ variable: `font-${name}`, className: name, style: {} })
  return Object.fromEntries(
    ['tangerine', 'poppinsHeading', 'poppinsBody', 'abrilFatface', 'cormorant', 'barlow', 'jost', 'parisienne'].map(
      (n) => [n, face(n)],
    ),
  )
})
vi.mock('@/app/lib/nav', () => ({ getBuilderNavLinks: async () => [] }))
vi.mock('@/app/lib/siteDesign', () => ({
  getSiteDesign: async () => ({ animationsEnabled: true, logoUrl: null }),
  themeToCssVars: () => '--color-bg: #E4E2D8;',
}))
vi.mock('@/app/lib/siteConfig', () => ({ getSiteConfig: async () => ({ title: 'Studio', menuCards: [] }) }))
vi.mock('../components/Navbar/Navbar', () => ({ default: () => null }))
vi.mock('../components/Footer/Footer', () => ({ default: () => null }))
vi.mock('../components/DesignPreviewBridge', () => ({ DesignPreviewBridge: () => null }))
vi.mock('@vercel/analytics/next', () => ({ Analytics: () => null }))
vi.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }))

import RootLayout from './layout'

type El = ReactElement<{ children?: ReactNode; dangerouslySetInnerHTML?: { __html: string } }>
const childElements = (el: El) => Children.toArray(el.props.children).filter(isValidElement) as El[]

describe('app/(site)/layout.tsx document shell', () => {
  // A <style> placed directly in <html> is invalid HTML: the browser's parser
  // moves it into <head>, so the DOM React hydrates no longer matches what it
  // rendered (React: "<style> cannot be a child of <html>. This will cause a
  // hydration error.").
  it('only puts <head> and <body> directly inside <html>', async () => {
    const html = (await RootLayout({ children: null })) as El
    expect(html.type).toBe('html')
    expect(childElements(html).map((c) => c.type)).toEqual(['head', 'body'])
  })

  it('keeps the SiteDesign theme variables in a <style> inside <head>', async () => {
    const html = (await RootLayout({ children: null })) as El
    const head = childElements(html).find((c) => c.type === 'head')
    const style = head && childElements(head).find((c) => c.type === 'style')
    expect(style?.props.dangerouslySetInnerHTML?.__html).toContain('--color-bg: #E4E2D8;')
  })

  // A plain <style> is written after Next's precedence stylesheets, so the
  // theme overrides tokens.css's fallbacks. Giving it `precedence` or `href`
  // hands it to React's stylesheet ordering, where it can land before them.
  it('keeps the theme <style> plain so it stays after the stylesheets it overrides', async () => {
    const html = (await RootLayout({ children: null })) as El
    const head = childElements(html).find((c) => c.type === 'head')
    const style = head && (childElements(head).find((c) => c.type === 'style') as ReactElement<Record<string, unknown>>)
    expect(style?.props.precedence).toBeUndefined()
    expect(style?.props.href).toBeUndefined()
  })
})
