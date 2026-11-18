import type { Data } from '@measured/puck'

// The Rising Roots About page as data: pure and free of path aliases, like
// homeLayout.ts. The words and photos Tynnell already has on the live About
// page are carried over by position; sections that need new words from her
// (the closing testimonial, the "things that make my heart full" list) start
// blank with "Hide until filled in" on, so nothing invented reaches a visitor.

export type AboutWords = {
  heroImage: string
  heroEyebrow: string
  heroHeading: string
  heroSubheading: string
  storyImage: string
  storyEyebrow: string
  storyHeading: string
  storyBody: string
  beliefEyebrow: string
  beliefLead: string
  beliefBody: string
  shootEyebrow: string
  shootHeading: string
  ctaHeading: string
  ctaSubtext: string
  ctaButtonText: string
  ctaButtonHref: string
}

export const BLANK_ABOUT_WORDS: AboutWords = {
  heroImage: '',
  heroEyebrow: '',
  heroHeading: '',
  heroSubheading: '',
  storyImage: '',
  storyEyebrow: '',
  storyHeading: '',
  storyBody: '',
  beliefEyebrow: '',
  beliefLead: '',
  beliefBody: '',
  shootEyebrow: '',
  shootHeading: '',
  ctaHeading: '',
  ctaSubtext: '',
  ctaButtonText: '',
  ctaButtonHref: '',
}

type Loose = Record<string, unknown>
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const asObj = (v: unknown): Loose => (v && typeof v === 'object' ? (v as Loose) : {})
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

// Reads the old freeform About by position: block 0 hero, 2 story, 3 belief
// heading, 4 belief text, 5 "What I Shoot" heading, 7 call to action. The
// session types block is found by type. Anything missing is ''.
export function aboutWordsFromCurrent(current: unknown): AboutWords & { specialties: Loose | null } {
  const blocks = asArray(asObj(current).content)
  const elementsOf = (i: number) => asArray(asObj(asObj(blocks[i]).props).elements).map(asObj)
  const props = (e: Loose | undefined) => asObj(e?.props)
  const ofType = (els: Loose[], type: string) => els.filter((e) => e.type === type)
  const text = (els: Loose[], i: number) => str(props(ofType(els, 'TextElement')[i]).text)

  const hero = elementsOf(0)
  const story = elementsOf(2)
  const beliefHead = elementsOf(3)
  const beliefBody = elementsOf(4)
  const shoot = elementsOf(5)
  const cta = elementsOf(7)
  const ctaButton = props(ofType(cta, 'ButtonElement')[0])
  const reveal = blocks.map(asObj).find((b) => b.type === 'SpecialtiesReveal')

  return {
    heroImage: str(props(ofType(hero, 'ImageElement')[0]).url),
    heroEyebrow: text(hero, 0),
    heroHeading: text(hero, 1),
    heroSubheading: text(hero, 2),
    storyImage: str(props(ofType(story, 'ImageElement')[0]).url),
    storyEyebrow: text(story, 0),
    storyHeading: text(story, 1),
    storyBody: text(story, 2),
    beliefEyebrow: text(beliefHead, 0),
    beliefLead: text(beliefHead, 1),
    beliefBody: text(beliefBody, 0),
    shootEyebrow: text(shoot, 0),
    shootHeading: text(shoot, 1),
    ctaHeading: text(cta, 0),
    ctaSubtext: text(cta, 1),
    ctaButtonText: str(ctaButton.text),
    ctaButtonHref: str(ctaButton.href),
    specialties: reveal ? asObj(reveal.props) : null,
  }
}

const style = { background: 'transparent', spacing: 'normal' }

export function buildAbout(words: AboutWords = BLANK_ABOUT_WORDS, specialties: Loose | null = null): Data {
  const w = words
  const content: Loose[] = [
    {
      type: 'Hero',
      props: {
        id: 'about-hero',
        layout: 'bottom',
        eyebrow: w.heroEyebrow,
        heading: w.heroHeading,
        subheading: w.heroSubheading,
        imageUrl: w.heroImage,
        height: '80vh',
        backgroundBehavior: 'scroll',
        align: 'left',
        buttonText: '',
        buttonHref: '',
        cornerLeft: '',
        cornerRight: '',
      },
    },
    {
      type: 'SplitImageText',
      props: {
        id: 'about-story',
        layout: 'side-by-side',
        imageUrl: w.storyImage,
        imagePosition: 'left',
        eyebrow: w.storyEyebrow,
        heading: w.storyHeading,
        body: w.storyBody,
        buttonText: '',
        buttonHref: '',
        imageBleed: 'none',
        imageOffset: 'none',
        hideUntilFilled: true,
        background: 'transparent',
      },
    },
    {
      // What I Believe: a text-only split (no photo), which the hide switch
      // lays out as a readable column.
      type: 'SplitImageText',
      props: {
        id: 'about-belief',
        layout: 'side-by-side',
        imageUrl: '',
        imagePosition: 'right',
        eyebrow: w.beliefEyebrow,
        heading: w.beliefLead,
        body: w.beliefBody,
        buttonText: '',
        buttonHref: '',
        imageBleed: 'none',
        imageOffset: 'none',
        hideUntilFilled: true,
        background: 'transparent',
      },
    },
    {
      type: 'Statement',
      props: { id: 'about-quote', lead: '', text: '', closing: '', style: 'quote', align: 'center', hideUntilFilled: true, ...style },
    },
    {
      type: 'FeatureColumns',
      props: { id: 'about-heart-full', heading: '', columns: [{ title: '', lines: '' }], hideUntilFilled: true, ...style },
    },
  ]

  if (specialties) {
    if (w.shootEyebrow || w.shootHeading) {
      content.push({
        type: 'SectionHeading',
        props: { id: 'about-shoot-heading', eyebrow: w.shootEyebrow, heading: w.shootHeading, subtext: '', align: 'center', ...style },
      })
    }
    // Carried verbatim, so her session list, photos and background survive.
    content.push({ type: 'SpecialtiesReveal', props: specialties })
  }

  content.push(
    {
      type: 'LiveTestimonials',
      props: { id: 'about-kind-words', stickyPhotoScroll: 'slider', hideUntilFilled: true, ...style },
    },
    {
      type: 'CTA',
      props: {
        id: 'about-cta',
        heading: w.ctaHeading,
        subtext: w.ctaSubtext,
        buttonText: w.ctaButtonText,
        buttonHref: w.ctaButtonHref,
        background: 'transparent',
        spacing: 'spacious',
        hideUntilFilled: true,
      },
    },
  )

  return { root: {}, content } as Data
}
