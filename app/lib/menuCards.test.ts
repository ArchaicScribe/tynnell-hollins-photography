import { describe, it, expect } from 'vitest'
import { cleanMenuCards, MAX_MENU_CARDS } from './menuCards'

const wedding = { title: 'The wedding experience', linkLabel: 'Get the details', href: '/services', imageUrl: 'https://media.example/w.jpg' }

describe('cleanMenuCards', () => {
  it('keeps a complete card as it is', () => {
    expect(cleanMenuCards([wedding])).toEqual([wedding])
  })

  it('trims whitespace Tynnell may have typed around the values', () => {
    expect(cleanMenuCards([{ ...wedding, title: '  The wedding experience ', href: ' /services ' }])).toEqual([wedding])
  })

  it('drops a card with no title or no link, since it would be an empty box or a dead end', () => {
    expect(cleanMenuCards([{ ...wedding, title: '' }, { ...wedding, href: '  ' }])).toEqual([])
  })

  it('accepts a page on this site or a secure https link, and nothing else', () => {
    // The href is rendered as a link on every page of the public site, so a
    // javascript: or data: value would run script for every visitor.
    const hrefs = ['/contact', 'https://calendly.com/x', 'javascript:alert(1)', 'data:text/html,x', 'http://plain.example', '//evil.example', '/\\evil.example', 'services']
    // One card per call: a single list would stop at the two-card cap and
    // never look at the unsafe values further down.
    const kept = hrefs.filter((href) => cleanMenuCards([{ ...wedding, href }]).length === 1)

    expect(kept).toEqual(['/contact', 'https://calendly.com/x'])
  })

  it('drops an image that is not an https URL or a site path, but keeps the card', () => {
    expect(cleanMenuCards([{ ...wedding, imageUrl: 'javascript:alert(1)' }])).toEqual([{ ...wedding, imageUrl: '' }])
  })

  it('fills in a default link label when none is given', () => {
    expect(cleanMenuCards([{ ...wedding, linkLabel: '' }])[0].linkLabel).toBe('Get the details')
  })

  it(`keeps at most ${MAX_MENU_CARDS} cards`, () => {
    expect(cleanMenuCards([wedding, wedding, wedding])).toHaveLength(MAX_MENU_CARDS)
  })

  it('returns no cards for anything that is not a list of cards', () => {
    expect(cleanMenuCards(undefined)).toEqual([])
    expect(cleanMenuCards('nope')).toEqual([])
    expect(cleanMenuCards([null, 7, 'x'])).toEqual([])
  })
})
