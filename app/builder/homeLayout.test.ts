// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import type { Data } from '@measured/puck'
import { buildHome, homeWordsFromCurrent, BLANK_HOME_WORDS, type HomeWords } from './homeLayout'
import { getTemplateContent, templateOptions } from './templates'
import { markNavHero } from '@/app/lib/navHero'
import { config } from './puck.config'

// The shape of the live Home page (page 43) before this rebuild: freeform
// sections made of text, image and button elements.
const el = (type: string, props: Record<string, unknown>) => ({ type, props })
const liveHome = {
  root: {},
  content: [
    { type: 'FreeformSection', props: { id: 'home-hero', elements: [
      el('ImageElement', { url: '/hero-background.jpg' }),
      el('TextElement', { text: 'Lost in the Moment, Found in Forever', variant: 'heading' }),
      el('TextElement', { text: 'Weddings · Portraits · Families', variant: 'body' }),
      el('ButtonElement', { text: 'Book a Session', href: '/book' }),
    ] } },
    { type: 'FreeformSection', props: { elements: [
      el('TextElement', { text: 'A Few Favorites' }),
      el('TextElement', { text: 'Every frame tells a story' }),
    ] } },
    { type: 'PortfolioGrid', props: { category: 'portraits' } },
    { type: 'FreeformSection', props: { id: 'home-split', elements: [
      el('TextElement', { text: 'About', variant: 'eyebrow' }),
      el('TextElement', { text: "Hey, I'm Tynnell Hollins", variant: 'heading' }),
      el('TextElement', { text: 'Every Moment Deserves to Last Forever\n\nBased in New Mexico.', variant: 'body' }),
      el('ButtonElement', { text: 'My Story', href: '/about' }),
    ] } },
    { type: 'LiveTestimonials', props: {} },
    { type: 'FreeformSection', props: { elements: [
      el('TextElement', { text: 'Your Story Deserves to Be Captured' }),
      el('TextElement', { text: 'Reserve your date with a deposit.' }),
      el('ButtonElement', { text: 'Book a Session', href: '/book' }),
    ] } },
  ],
}

const carried: HomeWords = homeWordsFromCurrent(liveHome)

describe('homeWordsFromCurrent', () => {
  it('carries the existing hero, about and call-to-action words over unchanged', () => {
    expect(carried).toEqual({
      heroImage: '/hero-background.jpg',
      heroHeading: 'Lost in the Moment, Found in Forever',
      heroSubheading: 'Weddings · Portraits · Families',
      heroButtonText: 'Book a Session',
      heroButtonHref: '/book',
      favoritesHeading: 'A Few Favorites',
      favoritesSubtext: 'Every frame tells a story',
      aboutEyebrow: 'About',
      aboutHeading: "Hey, I'm Tynnell Hollins",
      aboutBody: 'Every Moment Deserves to Last Forever\n\nBased in New Mexico.',
      aboutButtonText: 'My Story',
      aboutButtonHref: '/about',
      ctaHeading: 'Your Story Deserves to Be Captured',
      ctaSubtext: 'Reserve your date with a deposit.',
      ctaButtonText: 'Book a Session',
      ctaButtonHref: '/book',
    })
  })

  it.each([
    ['undefined', undefined],
    ['an empty object', {}],
    ['no blocks', { content: [] }],
    ['a block with no props', { content: [{ type: 'Hero', props: {} }] }],
    ['elements that are not arrays', { content: [{ type: 'FreeformSection', props: { elements: 'nope' } }] }],
  ])('returns blanks, never "undefined", for %s', (_name, input) => {
    const words = homeWordsFromCurrent(input)

    expect(words).toEqual(BLANK_HOME_WORDS)
    expect(JSON.stringify(words)).not.toContain('undefined')
  })
})

describe('buildHome', () => {
  const home = buildHome(carried)
  const types = (home.content as { type: string }[]).map((b) => b.type)

  it('lays the sections out in the reference order', () => {
    expect(types).toEqual([
      'Hero', 'Statement', 'StatsRow', 'SplitImageText', 'LiveTestimonials', 'PathChoice',
      'Statement', 'SplitImageText', 'AlbumGrid', 'EmailSignup', 'CTA',
    ])
  })

  it('every block is a real builder block and has a unique id', () => {
    const blocks = home.content as { type: string; props: { id: string } }[]

    for (const b of blocks) expect(Object.keys(config.components)).toContain(b.type)
    expect(new Set(blocks.map((b) => b.props.id)).size).toBe(blocks.length)
  })

  it("every section that needs Tynnell's words starts hidden-until-filled", () => {
    const blocks = home.content as { type: string; props: { hideUntilFilled?: boolean } }[]

    for (const b of blocks.slice(1)) expect(b.props.hideUntilFilled).toBe(true)
  })

  it('puts the carried-over words in the hero, about, albums and call to action', () => {
    const [hero, , , , , , , about, albums, , cta] = home.content as { props: Record<string, unknown> }[]

    expect(hero.props).toMatchObject({ imageUrl: '/hero-background.jpg', heading: 'Lost in the Moment, Found in Forever', buttonHref: '/book' })
    expect(about.props).toMatchObject({ heading: "Hey, I'm Tynnell Hollins", buttonText: 'My Story' })
    expect(albums.props).toMatchObject({ heading: 'A Few Favorites', subtext: 'Every frame tells a story', layout: 'strip' })
    expect(cta.props).toMatchObject({ heading: 'Your Story Deserves to Be Captured', buttonHref: '/book' })
  })

  it('the first block marks the nav transparent when it has a photo', () => {
    const first = (markNavHero(home).content as { props: { navHero?: boolean } }[])[0]

    expect(first.props.navHero).toBe(true)
  })

  it('a blank home carries no invented words at all', () => {
    const wordKeys = ['eyebrow', 'heading', 'subheading', 'subtext', 'body', 'lead', 'text', 'closing', 'buttonText', 'label', 'imageUrl', 'cornerLeft', 'cornerRight', 'value']
    const found: string[] = []
    const walk = (v: unknown, path: string) => {
      if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`))
      else if (v && typeof v === 'object') {
        for (const [k, x] of Object.entries(v)) {
          if (wordKeys.includes(k) && typeof x === 'string' && x !== '') found.push(`${path}.${k}`)
          else walk(x, `${path}.${k}`)
        }
      }
    }
    walk(buildHome(BLANK_HOME_WORDS), 'home')

    expect(found).toEqual([])
  })
})

describe('home template', () => {
  it('is offered, and is the blank home', () => {
    expect(templateOptions.map((o) => o.value)).toContain('home')
    expect(getTemplateContent('home')).toEqual(buildHome(BLANK_HOME_WORDS) as Data)
  })
})
