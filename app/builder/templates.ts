import type { Data } from '@measured/puck'

// Starter templates for new builder pages (TYN-230). A non-technical user
// faces a blank canvas otherwise; these seed a ready-made layout she can edit
// in place. Props are partial on purpose - every block's render is defensive
// about missing props (undefined background/spacing/responsive fall back to
// sensible defaults), so we only set the content worth pre-filling.
//
// Each item needs a unique props.id within the document; ids are namespaced
// per template so they never collide inside one page.
export type TemplateKey = 'blank' | 'landing' | 'about' | 'gallery' | 'freeform'

export const templateOptions: { value: TemplateKey; label: string; description: string }[] = [
  { value: 'blank', label: 'Blank', description: 'Start from nothing and add sections yourself.' },
  { value: 'landing', label: 'Landing page', description: 'Hero, a story section, services, a quote, and a call to action.' },
  { value: 'about', label: 'About page', description: 'Intro hero, your story with a photo, and a closing call to action.' },
  { value: 'gallery', label: 'Photo gallery', description: 'Hero, a heading, and a photo grid ready for your images.' },
  { value: 'freeform', label: 'Freeform layout', description: 'A drag-and-arrange section with a heading, text, image, and button already placed - move anything, anywhere.' },
]

const TEMPLATES: Record<TemplateKey, Data> = {
  blank: { content: [], root: {} },

  landing: {
    root: {},
    content: [
      {
        type: 'Hero',
        props: {
          id: 'landing-hero',
          eyebrow: 'Tynnell Hollins Photography',
          heading: 'Refined. Editorial. Artful. Lasting.',
          subheading: 'Photos that feel like your favorite memory.',
          imageUrl: '',
          height: '60vh',
          align: 'left',
          buttonText: 'Book a Session',
          buttonHref: '/contact',
        },
      },
      {
        type: 'SplitImageText',
        props: {
          id: 'landing-split',
          imageUrl: '',
          imagePosition: 'left',
          eyebrow: 'About',
          heading: 'Where It All Began',
          body: 'Share the story behind your work. A sentence or two that gives visitors a sense of who you are and how you photograph.',
          buttonText: '',
          buttonHref: '',
          background: 'transparent',
        },
      },
      {
        type: 'Services',
        props: {
          id: 'landing-services',
          heading: 'Services',
          items: [
            { name: 'Portrait Session', price: '$350', description: 'A 1-hour session at the location of your choice.' },
            { name: 'Wedding Collection', price: 'From $2,800', description: 'Full-day coverage with a second shooter.' },
            { name: 'Family Session', price: '$450', description: 'Relaxed, candid portraits for the whole family.' },
          ],
          background: 'transparent',
          spacing: 'normal',
        },
      },
      {
        type: 'Testimonials',
        props: {
          id: 'landing-testimonials',
          heading: 'Kind Words',
          items: [
            { quote: 'Working with Tynnell was effortless. The photos feel like us.', name: 'Sarah & James' },
          ],
          background: '#131313',
          spacing: 'normal',
        },
      },
      {
        type: 'CTA',
        props: {
          id: 'landing-cta',
          heading: 'Ready to create something beautiful?',
          subtext: '',
          buttonText: 'Book a Session',
          buttonHref: '/contact',
          background: '#131313',
          spacing: 'spacious',
        },
      },
    ],
  },

  about: {
    root: {},
    content: [
      {
        type: 'Hero',
        props: {
          id: 'about-hero',
          eyebrow: 'About',
          heading: 'Hi, I am Tynnell',
          subheading: 'A little about me and how I work.',
          imageUrl: '',
          height: '45vh',
          align: 'center',
          buttonText: '',
          buttonHref: '',
        },
      },
      {
        type: 'SplitImageText',
        props: {
          id: 'about-split',
          imageUrl: '',
          imagePosition: 'right',
          eyebrow: 'My Story',
          heading: 'Behind the Lens',
          body: 'Tell visitors who you are, what drew you to photography, and what they can expect when they work with you. A warm paragraph or two goes a long way.',
          buttonText: '',
          buttonHref: '',
          background: 'transparent',
        },
      },
      {
        type: 'SectionHeading',
        props: {
          id: 'about-values-heading',
          eyebrow: 'What I Believe',
          heading: 'My Approach',
          subtext: '',
          align: 'center',
          background: 'transparent',
          spacing: 'normal',
        },
      },
      {
        type: 'RichText',
        props: {
          id: 'about-values-text',
          text: 'Describe your style and values here. What makes your photos feel different? How do you help people feel comfortable in front of the camera?',
          align: 'center',
          background: 'transparent',
          spacing: 'compact',
        },
      },
      {
        type: 'CTA',
        props: {
          id: 'about-cta',
          heading: 'Let us work together',
          subtext: '',
          buttonText: 'Get in Touch',
          buttonHref: '/contact',
          background: '#131313',
          spacing: 'spacious',
        },
      },
    ],
  },

  gallery: {
    root: {},
    content: [
      {
        type: 'Hero',
        props: {
          id: 'gallery-hero',
          eyebrow: 'Portfolio',
          heading: 'Selected Work',
          subheading: 'A collection of recent favorites.',
          imageUrl: '',
          height: '45vh',
          align: 'center',
          buttonText: '',
          buttonHref: '',
        },
      },
      {
        type: 'SectionHeading',
        props: {
          id: 'gallery-heading',
          eyebrow: 'Gallery',
          heading: 'Recent Sessions',
          subtext: 'Click the gallery below and use Add Photos to fill it with your images.',
          align: 'center',
          background: 'transparent',
          spacing: 'compact',
        },
      },
      {
        type: 'PhotoGallery',
        props: {
          id: 'gallery-grid',
          images: [],
          size: '300px',
          aspect: '4 / 5',
        },
      },
      {
        type: 'CTA',
        props: {
          id: 'gallery-cta',
          heading: 'Like what you see?',
          subtext: '',
          buttonText: 'Book a Session',
          buttonHref: '/contact',
          background: '#131313',
          spacing: 'spacious',
        },
      },
    ],
  },

  // TYN-355 Phase 4: a working example rather than a blank canvas, since
  // FreeformSection's whole appeal (drag anything, anywhere) is hard to
  // picture from an empty stage. Every freeform element needs its own
  // x/y/width/height/rotate set explicitly here - unlike the other templates'
  // blocks, these have no `??` fallback for position in their render, so an
  // undefined value would render as invalid CSS instead of a sensible default.
  freeform: {
    root: {},
    content: [
      {
        type: 'FreeformSection',
        props: {
          id: 'freeform-example-section',
          canvasHeight: '65vh',
          elements: [
            {
              type: 'TextElement',
              props: {
                id: 'freeform-example-heading',
                text: 'A Story Worth Telling',
                align: 'left',
                x: 8, y: 15, width: 42, height: 18, rotate: 0,
              },
            },
            {
              type: 'TextElement',
              props: {
                id: 'freeform-example-subtext',
                text: 'Drag, resize, and arrange each piece exactly how you want it - nothing here is fixed in place.',
                align: 'left',
                x: 8, y: 36, width: 38, height: 18, rotate: 0,
              },
            },
            {
              type: 'ButtonElement',
              props: {
                id: 'freeform-example-button',
                text: 'Book a Session',
                href: '/contact',
                align: 'left',
                x: 8, y: 58, width: 24, height: 9, rotate: 0,
              },
            },
            {
              type: 'ImageElement',
              props: {
                id: 'freeform-example-image',
                url: '',
                alt: '',
                focalX: 50, focalY: 50, imageOpacity: 100, overlayOpacity: 0, overlayColor: '#000000', anchorHref: '',
                x: 54, y: 8, width: 38, height: 80, rotate: 0,
              },
            },
          ],
          background: 'transparent',
          spacing: 'normal',
        },
      },
      {
        type: 'CTA',
        props: {
          id: 'freeform-example-cta',
          heading: 'Ready to create something beautiful?',
          subtext: '',
          buttonText: 'Book a Session',
          buttonHref: '/contact',
          background: '#131313',
          spacing: 'spacious',
        },
      },
    ],
  },
}

export function getTemplateContent(key: string | undefined): Data {
  if (key && key in TEMPLATES) return TEMPLATES[key as TemplateKey]
  return TEMPLATES.blank
}
