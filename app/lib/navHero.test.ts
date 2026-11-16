import { describe, it, expect } from 'vitest'
import type { Data } from '@measured/puck'
import { markNavHero } from './navHero'

// The nav is solid unless a page OPENS on a full-bleed photo. Only the first
// block of a builder page can say so; a Full Width Image halfway down a page
// must not turn the nav transparent over the bone ground at the top.

const doc = (...content: { type: string; props: Record<string, unknown> }[]): Data =>
  ({ content: content.map((c, i) => ({ type: c.type, props: { id: `b${i}`, ...c.props } })), root: {} }) as Data

const flagged = (d: Data) => d.content.map((c) => (c.props as { navHero?: boolean }).navHero === true)

describe('markNavHero', () => {
  it('flags a Hero with a photo when it is the first block', () => {
    expect(flagged(markNavHero(doc({ type: 'Hero', props: { layout: 'bottom', imageUrl: '/a.jpg' } })))).toEqual([true])
  })

  it('flags a Full Width Image with a photo when it is the first block', () => {
    expect(flagged(markNavHero(doc({ type: 'FullWidthImage', props: { imageUrl: '/a.jpg' } })))).toEqual([true])
  })

  it('does not flag a Full Width Image that is not first', () => {
    const out = markNavHero(doc({ type: 'SectionHeading', props: {} }, { type: 'FullWidthImage', props: { imageUrl: '/a.jpg' } }))
    expect(flagged(out)).toEqual([false, false])
  })

  it('does not flag a first block that is not a hero', () => {
    expect(flagged(markNavHero(doc({ type: 'SectionHeading', props: { imageUrl: '/a.jpg' } })))).toEqual([false])
  })

  it('does not flag a hero without a photo, or the split layout', () => {
    expect(flagged(markNavHero(doc({ type: 'Hero', props: { layout: 'bottom', imageUrl: '' } })))).toEqual([false])
    expect(flagged(markNavHero(doc({ type: 'Hero', props: { layout: 'split', imageUrl: '/a.jpg' } })))).toEqual([false])
  })

  it('does not flag a hero that is hidden on either device, so the nav is never transparent with no photo behind it', () => {
    expect(flagged(markNavHero(doc({ type: 'Hero', props: { imageUrl: '/a.jpg', hideOnMobile: true } })))).toEqual([false])
    expect(flagged(markNavHero(doc({ type: 'FullWidthImage', props: { imageUrl: '/a.jpg', hideOnDesktop: true } })))).toEqual([false])
  })

  it('copes with an empty page and leaves the input untouched', () => {
    expect(markNavHero({ content: [], root: {} } as Data).content).toEqual([])
    const input = doc({ type: 'Hero', props: { imageUrl: '/a.jpg' } })
    markNavHero(input)
    expect((input.content[0].props as { navHero?: boolean }).navHero).toBeUndefined()
  })
})
