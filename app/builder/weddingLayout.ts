import type { Data } from '@measured/puck'

// The Rising Roots wedding page as data: pure and free of path aliases, like
// homeLayout.ts, so the same function feeds the `wedding` starter template and
// scripts/write-page-drafts.ts (run with tsx). Every section that needs
// Tynnell's own words starts blank with "Hide until filled in" on, so nothing
// invented ever reaches a visitor. Prices, packages, steps and answers are
// hers to type.

const style = { background: 'transparent', spacing: 'normal' }

export function buildWedding(): Data {
  return {
    root: {},
    content: [
      {
        type: 'Hero',
        props: {
          id: 'wedding-hero',
          photoMovement: 'none',
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
        type: 'SplitImageText',
        props: {
          id: 'wedding-booking',
          photoMovement: 'medium',
          layout: 'side-by-side',
          imageUrl: '',
          imagePosition: 'right',
          eyebrow: '',
          heading: '',
          body: '',
          buttonText: '',
          buttonHref: '#inquire',
          imageBleed: 'none',
          imageOffset: 'none',
          hideUntilFilled: true,
          background: 'transparent',
        },
      },
      {
        type: 'Statement',
        props: { id: 'wedding-location', lead: '', text: '', closing: '', style: 'quote', align: 'center', hideUntilFilled: true, ...style },
      },
      {
        type: 'FeatureColumns',
        props: { id: 'wedding-benefits', heading: '', columns: [{ title: '', lines: '' }], hideUntilFilled: true, ...style },
      },
      {
        type: 'SplitImageText',
        props: {
          id: 'wedding-approach',
          photoMovement: 'medium',
          layout: 'side-by-side',
          imageUrl: '',
          imagePosition: 'left',
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
        props: {
          id: 'wedding-packages',
          heading: '',
          cards: [
            { name: '', price: '', description: '', features: '', buttonText: '', buttonHref: '' },
            { name: '', price: '', description: '', features: '', buttonText: '', buttonHref: '' },
            { name: '', price: '', description: '', features: '', buttonText: '', buttonHref: '' },
          ],
          hideUntilFilled: true,
          ...style,
        },
      },
      {
        type: 'FeatureColumns',
        props: {
          id: 'wedding-included',
          heading: '',
          columns: [{ title: '', lines: '' }, { title: '', lines: '' }, { title: '', lines: '' }],
          hideUntilFilled: true,
          ...style,
        },
      },
      {
        type: 'Steps',
        props: {
          id: 'wedding-steps',
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
        type: 'LiveTestimonials',
        props: { id: 'wedding-kind-words', stickyPhotoScroll: 'slider', hideUntilFilled: true, ...style },
      },
      {
        type: 'AlbumGrid',
        props: {
          id: 'wedding-albums',
          category: 'weddings',
          layout: 'grid',
          heading: '',
          subtext: '',
          buttonText: '',
          buttonHref: '/portfolio',
          hideUntilFilled: true,
          ...style,
        },
      },
      {
        type: 'InquiryForm',
        props: { id: 'wedding-inquiry', kind: 'wedding', eyebrow: '', heading: '', subtext: '', ...style },
      },
      {
        type: 'CTA',
        props: {
          id: 'wedding-cta',
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
        type: 'Accordion',
        props: { id: 'wedding-faq', heading: '', items: [{ title: '', body: '' }], hideUntilFilled: true, ...style },
      },
    ],
  } as Data
}
