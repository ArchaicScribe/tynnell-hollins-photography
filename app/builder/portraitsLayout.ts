import type { Data } from '@measured/puck'

// The Rising Roots portraits page as data: pure and free of path aliases, like
// weddingLayout.ts. Every section that needs Tynnell's own words starts blank
// with "Hide until filled in" on. The reviews stat is the Stats Row left blank
// until she has a real number; the session menu is four blank choice cards
// (Couple, Maternity, Newborn, Family) linking down the page or to albums.

const style = { background: 'transparent', spacing: 'normal' }
const blankCard = { imageUrl: '', label: '', href: '' }
const blankPackage = { name: '', price: '', description: '', features: '', buttonText: '', buttonHref: '' }

export function buildPortraits(): Data {
  return {
    root: {},
    content: [
      {
        type: 'Hero',
        props: {
          id: 'portraits-hero',
          photoMovement: 'gentle',
          layout: 'bottom',
          eyebrow: '',
          heading: '',
          subheading: '',
          imageUrl: '',
          height: '45vh', // short while blank; raise it in the editor once there is a photo
          backgroundBehavior: 'scroll',
          align: 'left',
          buttonText: '',
          buttonHref: '',
          cornerLeft: '',
          cornerRight: '',
        },
      },
      {
        type: 'Statement',
        props: { id: 'portraits-intro', lead: '', text: '', closing: '', style: 'text', align: 'center', hideUntilFilled: true, ...style },
      },
      {
        type: 'StatsRow',
        props: {
          id: 'portraits-reviews',
          heading: '',
          items: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }],
          buttonText: '',
          buttonHref: '#inquire',
          align: 'center',
          hideUntilFilled: true,
          ...style,
        },
      },
      {
        type: 'Statement',
        props: { id: 'portraits-quote', lead: '', text: '', closing: '', style: 'quote', align: 'center', hideUntilFilled: true, ...style },
      },
      {
        type: 'PathChoice',
        props: {
          id: 'portraits-sessions',
          heading: '',
          cards: [blankCard, blankCard, blankCard, blankCard],
          hideUntilFilled: true,
          ...style,
        },
      },
      {
        type: 'SplitImageText',
        props: {
          id: 'portraits-philosophy',
          photoMovement: 'gentle',
          layout: 'side-by-side',
          imageUrl: '',
          imagePosition: 'right',
          eyebrow: '',
          heading: '',
          body: '',
          buttonText: '',
          buttonHref: '',
          imageBleed: 'none',
          imageOffset: 'none',
          hideUntilFilled: true,
          background: 'transparent',
        },
      },
      {
        type: 'Packages',
        props: { id: 'portraits-packages', heading: '', cards: [blankPackage, blankPackage, blankPackage], hideUntilFilled: true, ...style },
      },
      {
        type: 'Steps',
        props: {
          id: 'portraits-steps',
          heading: '',
          steps: [
            { title: '', body: '' },
            { title: '', body: '' },
            { title: '', body: '' },
            { title: '', body: '' },
            { title: '', body: '' },
          ],
          hideUntilFilled: true,
          ...style,
        },
      },
      {
        type: 'CTA',
        props: {
          id: 'portraits-sounds-good',
          heading: '',
          subtext: '',
          buttonText: '',
          buttonHref: '#inquire',
          background: 'transparent',
          spacing: 'spacious',
          hideUntilFilled: true,
        },
      },
      {
        type: 'LiveTestimonials',
        props: { id: 'portraits-kind-words', stickyPhotoScroll: 'slider', hideUntilFilled: true, ...style },
      },
      {
        type: 'Accordion',
        props: { id: 'portraits-faq', heading: '', items: [{ title: '', body: '' }], hideUntilFilled: true, ...style },
      },
      {
        type: 'InquiryForm',
        props: { id: 'portraits-inquiry', kind: 'portrait', eyebrow: '', heading: '', subtext: '', ...style },
      },
      {
        type: 'CTA',
        props: {
          id: 'portraits-cta',
          heading: '',
          subtext: '',
          buttonText: '',
          buttonHref: '#inquire',
          background: 'transparent',
          spacing: 'spacious',
          hideUntilFilled: true,
        },
      },
    ],
  } as Data
}
