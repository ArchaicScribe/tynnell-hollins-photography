import { describe, it, expect } from 'vitest'
import { legacyRedirects } from './redirects.mjs'

// Wedding and Portraits became their own pages (/wedding-photography and
// /portraits). The old gallery category addresses must keep working for old
// links and search results, but must not swallow real album addresses.
describe('legacyRedirects', () => {
  it('sends the old gallery category pages to the new pages, permanently', () => {
    expect(legacyRedirects).toEqual([
      { source: '/portfolio/weddings', destination: '/wedding-photography', permanent: true },
      { source: '/portfolio/portraits', destination: '/portraits', permanent: true },
      { source: '/portfolio/family', destination: '/portraits', permanent: true },
    ])
  })

  it('matches exact paths only, so an album under /portfolio is never redirected', () => {
    for (const r of legacyRedirects) {
      expect(r.source).not.toMatch(/[:*()?]/)
    }
    const sources = legacyRedirects.map((r) => r.source)
    expect(sources).not.toContain('/portfolio/some-album')
  })
})
