import type { Data } from '@measured/puck'

// Obvious dummy text for the new inner pages, used by
// scripts/publish-placeholder-pages.ts when Alex wants the pages live before
// Tynnell has written her own words (2026-11-18). Every string starts with
// "[Placeholder]" so nobody mistakes it for real copy, and none contains a
// price, a number or a quote from a person: packages and the reviews stat have
// no entry here, so they stay hidden, and testimonials and albums stay
// data-driven. Only blank values are filled; words already on the page win.

type Loose = Record<string, unknown>
const P = '[Placeholder]'
const cols = (n: string[]) => n.map((title) => ({ title: `${P} ${title}`, lines: `${P} First item\n${P} Second item` }))
const steps = (n: string[]) => n.map((title) => ({ title: `${P} ${title}`, body: `${P} A sentence or two about this step.` }))
const faq = [
  { title: `${P} A common question`, body: `${P} The answer, in a sentence or two.` },
  { title: `${P} Another common question`, body: `${P} Another short answer.` },
]

const PATCHES: Record<string, Loose> = {
  // Wedding photography
  'wedding-hero': { heading: `${P} Wedding photography`, subheading: `${P} A short line about your wedding photography.` },
  'wedding-booking': { heading: `${P} Now booking weddings`, body: `${P} A few sentences introducing your wedding work. Replace this text with your own words.`, buttonText: `${P} Now booking` },
  'wedding-location': { text: `${P} A line about where you photograph weddings.` },
  'wedding-benefits': { heading: `${P} Why work with me`, columns: cols(['Benefits']) },
  'wedding-approach': { heading: `${P} My approach`, body: `${P} Describe how you photograph a wedding day.` },
  'wedding-included': { heading: `${P} What is included`, columns: cols(['Before', 'On the day', 'After']) },
  'wedding-steps': { heading: `${P} How booking works`, steps: steps(['First step', 'Second step', 'Third step']) },
  'wedding-albums': { heading: `${P} Wedding albums` },
  'wedding-inquiry': { heading: `${P} Inquire about your wedding`, subtext: `${P} Tell me about your day.` },
  'wedding-cta': { heading: `${P} Ready to talk about your day?`, subtext: `${P} A line inviting people to get in touch.`, buttonText: `${P} Inquire now` },
  'wedding-faq': { heading: `${P} Questions`, items: faq },

  // Portraits (the four session names are the inquiry form's own options)
  'portraits-hero': { heading: `${P} Portraits`, subheading: `${P} A short line about your portrait sessions.` },
  'portraits-intro': { text: `${P} A few sentences introducing your portrait work.` },
  'portraits-quote': { text: `${P} A line about what portrait sessions feel like.` },
  'portraits-sessions': {
    heading: `${P} Choose your session`,
    cards: [
      { label: 'Couple', href: '#inquire' },
      { label: 'Maternity', href: '#inquire' },
      { label: 'Newborn', href: '#inquire' },
      { label: 'Family', href: '#inquire' },
    ],
  },
  'portraits-philosophy': { heading: `${P} My philosophy`, body: `${P} Describe how you approach a portrait session.` },
  'portraits-steps': { heading: `${P} How booking works`, steps: steps(['First step', 'Second step', 'Third step']) },
  'portraits-sounds-good': { heading: `${P} Sounds good?`, subtext: `${P} A line inviting people to get in touch.`, buttonText: `${P} Inquire now` },
  'portraits-faq': { heading: `${P} Questions`, items: faq },
  'portraits-inquiry': { heading: `${P} Inquire about a session`, subtext: `${P} Tell me what you have in mind.` },
  'portraits-cta': { heading: `${P} Ready to book a session?`, subtext: `${P} A line inviting people to get in touch.`, buttonText: `${P} Inquire now` },

  // My work
  'mywork-tiles': {
    heading: `${P} Choose a collection`,
    cards: [
      { label: 'Weddings', href: '/wedding-photography' },
      { label: 'Portraits', href: '/portraits' },
    ],
  },
  'mywork-intro': { text: `${P} A line introducing your work.` },
  'mywork-weddings': { heading: `${P} Wedding albums` },
  'mywork-portraits': { heading: `${P} Portrait albums` },
  'mywork-about': { heading: `${P} A little about me`, body: `${P} A few sentences about you.`, buttonText: `${P} About me` },
  'mywork-cta': { heading: `${P} Ready to work together?`, subtext: `${P} A line inviting people to get in touch.`, buttonText: `${P} Inquire now` },

  // Contact
  'contact-hero': { heading: `${P} Get in touch`, subheading: `${P} A line about how to reach you.` },
  'contact-inquiry': { heading: `${P} Send an inquiry` },
  'contact-details': { text: `${P} Your email, social links and the area you cover.` },
  'contact-faq': { heading: `${P} Questions`, items: faq },
}

// Fills blank strings from `patch`, recursing into objects and, by position,
// into arrays. Anything already written stays.
function fill(current: unknown, patch: unknown): unknown {
  if (typeof patch === 'string') {
    return typeof current === 'string' && current.trim() !== '' ? current : patch
  }
  if (Array.isArray(patch)) {
    const base = Array.isArray(current) ? current : []
    return patch.map((p, i) => fill(base[i], p)).concat(base.slice(patch.length))
  }
  if (patch && typeof patch === 'object') {
    const base = current && typeof current === 'object' && !Array.isArray(current) ? (current as Loose) : {}
    const out: Loose = { ...base }
    for (const [k, v] of Object.entries(patch as Loose)) out[k] = fill(base[k], v)
    return out
  }
  return current
}

export function fillPlaceholders(data: Data): Data {
  return {
    ...data,
    content: data.content.map((b) => {
      const props = b.props as Loose
      const patch = PATCHES[String(props.id)]
      return patch ? { ...b, props: fill(props, patch) as typeof b.props } : b
    }),
  } as Data
}
