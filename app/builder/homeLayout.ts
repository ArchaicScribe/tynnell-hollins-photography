import type { Data } from '@measured/puck'

// The Rising Roots Home page as data. Pure and free of path aliases so the
// same function feeds both the blank `home` starter template (templates.ts)
// and scripts/write-home-draft.ts (run with tsx). Every section that needs
// the photographer's own words starts blank with "Hide until filled in" on, so
// nothing invented ever reaches a visitor; only the hero, About, albums
// heading and call-to-action words that were already on the live Home page
// are carried over.

export type HomeWords = {
  heroImage: string
  heroHeading: string
  heroSubheading: string
  heroButtonText: string
  heroButtonHref: string
  favoritesHeading: string
  favoritesSubtext: string
  aboutEyebrow: string
  aboutHeading: string
  aboutBody: string
  aboutButtonText: string
  aboutButtonHref: string
  ctaHeading: string
  ctaSubtext: string
  ctaButtonText: string
  ctaButtonHref: string
}

export const BLANK_HOME_WORDS: HomeWords = {
  heroImage: '',
  heroHeading: '',
  heroSubheading: '',
  heroButtonText: '',
  heroButtonHref: '',
  favoritesHeading: '',
  favoritesSubtext: '',
  aboutEyebrow: '',
  aboutHeading: '',
  aboutBody: '',
  aboutButtonText: '',
  aboutButtonHref: '',
  ctaHeading: '',
  ctaSubtext: '',
  ctaButtonText: '',
  ctaButtonHref: '',
}

type Loose = Record<string, unknown>
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const asObj = (v: unknown): Loose => (v && typeof v === 'object' ? (v as Loose) : {})
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

// Reads the words out of the old freeform Home by position: block 0 hero,
// 1 favorites heading, 3 About, 5 call to action. Anything missing is ''.
export function homeWordsFromCurrent(current: unknown): HomeWords {
  const blocks = asArray(asObj(current).content)
  const elementsOf = (i: number) => asArray(asObj(asObj(blocks[i]).props).elements).map(asObj)
  const props = (e: Loose | undefined) => asObj(e?.props)
  const ofType = (els: Loose[], type: string) => els.filter((e) => e.type === type)

  const hero = elementsOf(0)
  const heroText = ofType(hero, 'TextElement')
  const heroButton = props(ofType(hero, 'ButtonElement')[0])
  const fav = ofType(elementsOf(1), 'TextElement')
  const about = elementsOf(3)
  const aboutText = ofType(about, 'TextElement')
  const aboutButton = props(ofType(about, 'ButtonElement')[0])
  const cta = elementsOf(5)
  const ctaText = ofType(cta, 'TextElement')
  const ctaButton = props(ofType(cta, 'ButtonElement')[0])

  return {
    heroImage: str(props(ofType(hero, 'ImageElement')[0]).url),
    heroHeading: str(props(heroText[0]).text),
    heroSubheading: str(props(heroText[1]).text),
    heroButtonText: str(heroButton.text),
    heroButtonHref: str(heroButton.href),
    favoritesHeading: str(props(fav[0]).text),
    favoritesSubtext: str(props(fav[1]).text),
    aboutEyebrow: str(props(aboutText[0]).text),
    aboutHeading: str(props(aboutText[1]).text),
    aboutBody: str(props(aboutText[2]).text),
    aboutButtonText: str(aboutButton.text),
    aboutButtonHref: str(aboutButton.href),
    ctaHeading: str(props(ctaText[0]).text),
    ctaSubtext: str(props(ctaText[1]).text),
    ctaButtonText: str(ctaButton.text),
    ctaButtonHref: str(ctaButton.href),
  }
}

const style = { background: 'transparent', spacing: 'normal' }

export function buildHome(w: HomeWords): Data {
  return {
    root: {},
    content: [
      {
        type: 'Hero',
        props: {
          id: 'home-hero',
          photoMovement: 'gentle',
          layout: 'bottom',
          eyebrow: '',
          heading: w.heroHeading,
          subheading: w.heroSubheading,
          imageUrl: w.heroImage,
          height: '100vh',
          backgroundBehavior: 'scroll',
          align: 'left',
          buttonText: w.heroButtonText,
          buttonHref: w.heroButtonHref,
          cornerLeft: '',
          cornerRight: '',
        },
      },
      {
        type: 'Statement',
        props: { id: 'home-intro', lead: '', text: '', closing: '', style: 'text', align: 'center', hideUntilFilled: true, ...style },
      },
      {
        type: 'StatsRow',
        props: {
          id: 'home-stats',
          heading: '',
          items: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }],
          buttonText: '',
          buttonHref: '/contact',
          align: 'center',
          hideUntilFilled: true,
          ...style,
        },
      },
      {
        type: 'SplitImageText',
        props: {
          id: 'home-where',
          photoMovement: 'gentle',
          layout: 'side-by-side',
          imageUrl: '',
          imagePosition: 'left',
          eyebrow: '',
          heading: '',
          body: '',
          buttonText: '',
          buttonHref: '/contact',
          imageBleed: 'none',
          imageOffset: 'none',
          hideUntilFilled: true,
          background: 'transparent',
        },
      },
      {
        type: 'LiveTestimonials',
        props: { id: 'home-kind-words', stickyPhotoScroll: 'slider', hideUntilFilled: true, ...style },
      },
      {
        type: 'PathChoice',
        props: {
          id: 'home-paths',
          heading: '',
          cards: [{ imageUrl: '', label: '', href: '' }, { imageUrl: '', label: '', href: '' }],
          hideUntilFilled: true,
          ...style,
        },
      },
      {
        type: 'Statement',
        props: { id: 'home-quote', lead: '', text: '', closing: '', style: 'quote', align: 'center', hideUntilFilled: true, ...style },
      },
      {
        type: 'SplitImageText',
        props: {
          id: 'home-about',
          photoMovement: 'gentle',
          layout: 'side-by-side',
          imageUrl: '',
          imagePosition: 'right',
          eyebrow: w.aboutEyebrow,
          heading: w.aboutHeading,
          body: w.aboutBody,
          buttonText: w.aboutButtonText,
          buttonHref: w.aboutButtonHref,
          imageBleed: 'none',
          imageOffset: 'none',
          hideUntilFilled: true,
          background: 'transparent',
        },
      },
      {
        type: 'AlbumGrid',
        props: {
          id: 'home-albums',
          category: 'weddings',
          layout: 'strip',
          heading: w.favoritesHeading,
          subtext: w.favoritesSubtext,
          buttonText: '',
          buttonHref: '/portfolio',
          hideUntilFilled: true,
          ...style,
        },
      },
      {
        type: 'EmailSignup',
        props: {
          id: 'home-freebie',
          kind: 'freebie',
          imageUrl: '',
          eyebrow: '',
          heading: '',
          body: '',
          buttonText: '',
          successMessage: '',
          hideUntilFilled: true,
          ...style,
        },
      },
      {
        type: 'CTA',
        props: {
          id: 'home-cta',
          heading: w.ctaHeading,
          subtext: w.ctaSubtext,
          buttonText: w.ctaButtonText,
          buttonHref: w.ctaButtonHref,
          background: 'transparent',
          spacing: 'spacious',
          hideUntilFilled: true,
        },
      },
    ],
  } as Data
}
