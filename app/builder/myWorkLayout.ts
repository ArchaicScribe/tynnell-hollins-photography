import type { Data } from '@measured/puck'

// The Rising Roots "My work" page as data: pure and free of path aliases. The
// eyebrow and heading Tynnell already has on the live Portfolio page are
// carried over; everything else starts blank and hidden until she fills it in.

export type MyWorkWords = { heroEyebrow: string; heroHeading: string }

type Loose = Record<string, unknown>
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const asObj = (v: unknown): Loose => (v && typeof v === 'object' ? (v as Loose) : {})
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

// Block 0 of the old freeform page holds the eyebrow, then the heading.
export function myWorkWordsFromCurrent(current: unknown): MyWorkWords {
  const blocks = asArray(asObj(current).content)
  const texts = asArray(asObj(asObj(blocks[0]).props).elements)
    .map(asObj)
    .filter((e) => e.type === 'TextElement')
    .map((e) => str(asObj(e.props).text))
  return { heroEyebrow: texts[0] ?? '', heroHeading: texts[1] ?? '' }
}

const style = { background: 'transparent', spacing: 'normal' }

export function buildMyWork(words: MyWorkWords = { heroEyebrow: '', heroHeading: '' }): Data {
  return {
    root: {},
    content: [
      {
        type: 'Hero',
        props: {
          id: 'mywork-hero',
          photoMovement: 'gentle',
          layout: 'bottom',
          eyebrow: words.heroEyebrow,
          heading: words.heroHeading,
          subheading: '',
          imageUrl: '',
          height: '60vh',
          backgroundBehavior: 'scroll',
          align: 'left',
          buttonText: '',
          buttonHref: '',
          cornerLeft: '',
          cornerRight: '',
        },
      },
      {
        type: 'PathChoice',
        props: {
          id: 'mywork-tiles',
          heading: '',
          cards: [{ imageUrl: '', label: '', href: '' }, { imageUrl: '', label: '', href: '' }],
          hideUntilFilled: true,
          ...style,
        },
      },
      {
        type: 'Statement',
        props: { id: 'mywork-intro', lead: '', text: '', closing: '', style: 'text', align: 'center', hideUntilFilled: true, ...style },
      },
      {
        type: 'AlbumGrid',
        props: { id: 'mywork-weddings', category: 'weddings', layout: 'strip', heading: '', subtext: '', buttonText: '', buttonHref: '/wedding-photography', hideUntilFilled: true, ...style },
      },
      {
        type: 'AlbumGrid',
        props: { id: 'mywork-portraits', category: 'portraits', layout: 'grid', heading: '', subtext: '', buttonText: '', buttonHref: '/portraits', hideUntilFilled: true, ...style },
      },
      {
        type: 'SplitImageText',
        props: {
          id: 'mywork-about',
          photoMovement: 'gentle',
          layout: 'side-by-side',
          imageUrl: '',
          imagePosition: 'right',
          eyebrow: '',
          heading: '',
          body: '',
          buttonText: '',
          buttonHref: '/about',
          imageBleed: 'none',
          imageOffset: 'none',
          hideUntilFilled: true,
          background: 'transparent',
        },
      },
      {
        type: 'LiveTestimonials',
        props: { id: 'mywork-kind-words', stickyPhotoScroll: 'slider', hideUntilFilled: true, ...style },
      },
      {
        type: 'CTA',
        props: {
          id: 'mywork-cta',
          heading: '',
          subtext: '',
          buttonText: '',
          buttonHref: '/contact',
          background: 'transparent',
          spacing: 'spacious',
          hideUntilFilled: true,
        },
      },
    ],
  } as Data
}
