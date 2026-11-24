import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// Heading scale match with Rising Roots (2026-11-24). The reference sets every section
// heading at 48px with a 1.2 line height at desktop width; ours were 38 to 44px at 1.1,
// which read as smaller and tighter next to the lighter weight. One clamp covers it:
// 3.75vw is 48px at the 1278px the reference was measured at, capped at 3rem.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components = config.components as Record<string, any>
const html = (name: string, props: Record<string, unknown>) =>
  renderToStaticMarkup(components[name].render({ ...components[name].defaultProps, ...props, puck: {} }) as ReactElement)

const SECTION = 'font-size:clamp(1.9rem, 3.75vw, 3rem)'

const sectionHeading = (markup: string, tag = 'h2') => markup.match(new RegExp(`<${tag}[^>]*style="([^"]*)"`))?.[1] ?? ''

const cases: [string, Record<string, unknown>][] = [
  ['SectionHeading', { heading: 'H' }],
  ['SplitImageText', { heading: 'H', body: 'b', layout: 'split' }],
  ['SplitImageText', { heading: 'H', body: 'b', layout: 'stacked' }],
  ['SplitImageText', { heading: 'H', body: 'b', layout: 'overlay', imageUrl: '/a.jpg' }],
  ['CTA', { heading: 'H' }],
  ['Accordion', { heading: 'H', items: [{ title: 'Q', body: 'a' }] }],
  ['Services', { heading: 'H', items: [{ name: 'S', price: '$1', description: 'd', features: 'f' }] }],
  ['Testimonials', { heading: 'H', items: [{ quote: 'Q', name: 'N' }] }],
  ['PathChoice', { heading: 'H', cards: [{ label: 'C', href: '/c', imageUrl: '' }] }],
]

describe('section headings follow the reference scale', () => {
  it.each(cases)('%s: 48px at desktop width', (name, props) => {
    expect(sectionHeading(html(name, props))).toContain(SECTION)
  })

  it.each(cases)('%s: line height 1.2', (name, props) => {
    expect(sectionHeading(html(name, props))).toMatch(/line-height:1\.2(;|$)/)
  })
})

describe('headings that are not section headings keep their own, smaller size', () => {
  it('a card title in Packages stays smaller than a section heading', () => {
    const card = html('Packages', { heading: 'H', cards: [{ name: 'Card name', price: '$1', description: 'd', features: 'f', buttonText: '', buttonHref: '' }] })

    expect(sectionHeading(card, 'h3')).not.toContain(SECTION)
  })
})
