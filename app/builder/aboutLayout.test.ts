import { describe, it, expect } from 'vitest'
import { buildAbout, aboutWordsFromCurrent, BLANK_ABOUT_WORDS } from './aboutLayout'
import { layoutForSlug } from './pageLayouts'

// The shape of the live About page (page 33): freeform sections of text,
// image and button elements, a spacer, and the session-types reveal block.
const el = (type: string, props: Record<string, unknown>) => ({ type, props })
const specialtiesProps = {
  id: 'SpecialtiesReveal-1',
  items: [{ heading: 'Weddings', body: '', photo: '' }, { heading: 'Portraits', body: '', photo: '/p.jpg' }],
  backgroundImage: '/bg.jpg',
}
const liveAbout = {
  root: {},
  content: [
    { type: 'FreeformSection', props: { id: 'about-hero', elements: [
      el('ImageElement', { url: '/selfie-3.jpg' }),
      el('TextElement', { text: 'About' }),
      el('TextElement', { text: 'Tynnell Hollins' }),
      el('TextElement', { text: 'The Woman Behind the Lens' }),
    ] } },
    { type: 'Spacer', props: { id: 'Spacer-1', size: '4rem' } },
    { type: 'FreeformSection', props: { id: 'about-split', elements: [
      el('ImageElement', { url: '/selfie-4.jpg' }),
      el('TextElement', { text: 'My Story' }),
      el('TextElement', { text: 'Where It All Began' }),
      el('TextElement', { text: 'Based in New Mexico.' }),
    ] } },
    { type: 'FreeformSection', props: { elements: [el('TextElement', { text: 'What I Believe' }), el('TextElement', { text: 'I do not just take photographs' })] } },
    { type: 'FreeformSection', props: { elements: [el('TextElement', { text: 'I preserve the in-between moments.' })] } },
    { type: 'FreeformSection', props: { elements: [el('TextElement', { text: 'What I Shoot' }), el('TextElement', { text: 'Capturing Life’s Most Meaningful Moments' })] } },
    { type: 'SpecialtiesReveal', props: specialtiesProps },
    { type: 'FreeformSection', props: { id: 'about-cta', elements: [
      el('TextElement', { text: 'Ready to Create Something Beautiful?' }),
      el('TextElement', { text: 'I would love to hear your story.' }),
      el('ButtonElement', { text: 'Book a Session', href: '/contact' }),
    ] } },
  ],
}

describe('aboutWordsFromCurrent', () => {
  it('carries the live About words and photos over by position', () => {
    const w = aboutWordsFromCurrent(liveAbout)

    expect(w).toMatchObject({
      heroImage: '/selfie-3.jpg',
      heroEyebrow: 'About',
      heroHeading: 'Tynnell Hollins',
      heroSubheading: 'The Woman Behind the Lens',
      storyImage: '/selfie-4.jpg',
      storyEyebrow: 'My Story',
      storyHeading: 'Where It All Began',
      storyBody: 'Based in New Mexico.',
      beliefEyebrow: 'What I Believe',
      beliefLead: 'I do not just take photographs',
      beliefBody: 'I preserve the in-between moments.',
      shootEyebrow: 'What I Shoot',
      ctaHeading: 'Ready to Create Something Beautiful?',
      ctaSubtext: 'I would love to hear your story.',
      ctaButtonText: 'Book a Session',
      ctaButtonHref: '/contact',
    })
  })

  it('keeps the session types block exactly as it was', () => {
    expect(aboutWordsFromCurrent(liveAbout).specialties).toEqual(specialtiesProps)
  })

  it('gives blanks, not a crash, for empty or odd content', () => {
    for (const odd of [undefined, null, {}, { content: 'nope' }, { content: [null, 3, {}] }]) {
      const w = aboutWordsFromCurrent(odd)
      expect(w.specialties).toBeNull()
      const { specialties, ...words } = w
      void specialties
      expect(words).toEqual(BLANK_ABOUT_WORDS)
    }
  })
})

describe('buildAbout', () => {
  it('puts the carried hero photo and words on the Hero', () => {
    const w = aboutWordsFromCurrent(liveAbout)
    const hero = buildAbout(w, w.specialties).content[0]

    expect(hero.type).toBe('Hero')
    expect(hero.props).toMatchObject({ imageUrl: '/selfie-3.jpg', heading: 'Tynnell Hollins', subheading: 'The Woman Behind the Lens' })
  })

  it('includes the session types and their heading only when they were carried over', () => {
    const w = aboutWordsFromCurrent(liveAbout)
    const withIt = buildAbout(w, w.specialties).content.map((b) => b.type)
    const blank = buildAbout().content.map((b) => b.type)

    expect(withIt).toContain('SpecialtiesReveal')
    expect(withIt).toContain('SectionHeading')
    expect(blank).not.toContain('SpecialtiesReveal')
    expect(blank).not.toContain('SectionHeading')
  })

  it('gives every block a unique id, with or without carried words', () => {
    const w = aboutWordsFromCurrent(liveAbout)
    for (const data of [buildAbout(), buildAbout(w, w.specialties)]) {
      const ids = data.content.map((b) => (b.props as { id: string }).id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('is what the about page address builds from its current content', () => {
    const w = aboutWordsFromCurrent(liveAbout)

    expect(layoutForSlug('about', liveAbout)).toEqual(buildAbout(w, w.specialties))
  })
})
