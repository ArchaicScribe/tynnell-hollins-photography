import { describe, it, expect } from 'vitest'
import { buildMyWork, myWorkWordsFromCurrent } from './myWorkLayout'
import { layoutForSlug } from './pageLayouts'

// The live My work page (page 44): a freeform heading section, then the grid.
const liveMyWork = {
  root: {},
  content: [
    { type: 'FreeformSection', props: { id: 'portfolio-heading', elements: [
      { type: 'TextElement', props: { text: 'Portfolio' } },
      { type: 'TextElement', props: { text: 'Selected Work' } },
    ] } },
    { type: 'PortfolioGrid', props: { id: 'portfolio-grid', category: 'all' } },
  ],
}

describe('myWorkWordsFromCurrent', () => {
  it('carries the live eyebrow and heading over', () => {
    expect(myWorkWordsFromCurrent(liveMyWork)).toEqual({ heroEyebrow: 'Portfolio', heroHeading: 'Selected Work' })
  })

  it('gives blanks, not a crash, for empty or odd content', () => {
    for (const odd of [undefined, null, {}, { content: 'x' }, { content: [null, 4] }]) {
      expect(myWorkWordsFromCurrent(odd)).toEqual({ heroEyebrow: '', heroHeading: '' })
    }
  })
})

describe('buildMyWork', () => {
  it('lists its sections in the Rising Roots order', () => {
    expect(buildMyWork().content.map((b) => b.type)).toEqual([
      'Hero', 'PathChoice', 'Statement', 'AlbumGrid', 'AlbumGrid', 'SplitImageText', 'LiveTestimonials', 'CTA',
    ])
  })

  it('puts the carried words on the Hero', () => {
    const hero = buildMyWork({ heroEyebrow: 'Portfolio', heroHeading: 'Selected Work' }).content[0]

    expect(hero.props).toMatchObject({ eyebrow: 'Portfolio', heading: 'Selected Work' })
  })

  it('shows wedding albums as a strip and portrait albums as a grid', () => {
    const albums = buildMyWork().content.filter((b) => b.type === 'AlbumGrid').map((b) => b.props)

    expect(albums[0]).toMatchObject({ category: 'weddings', layout: 'strip' })
    expect(albums[1]).toMatchObject({ category: 'portraits', layout: 'grid' })
  })

  it('has two blank category tiles', () => {
    const tiles = buildMyWork().content.find((b) => b.type === 'PathChoice')!.props as { cards: unknown[] }

    expect(tiles.cards).toHaveLength(2)
  })

  it('is what the live My work page address builds from its current content', () => {
    expect(layoutForSlug('portfolio-builder', liveMyWork)).toEqual(buildMyWork({ heroEyebrow: 'Portfolio', heroHeading: 'Selected Work' }))
  })
})
