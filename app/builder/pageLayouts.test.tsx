// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import type { Data } from '@measured/puck'
import { buildWedding } from './weddingLayout'
import { buildPortraits } from './portraitsLayout'
import { buildContact } from './contactLayout'
import { LAYOUTS, layoutForSlug, assertCanCreate, assertCanDraft } from './pageLayouts'
import { getTemplateContent } from './templates'
import { config } from './puck.config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components = config.components as Record<string, any>

const types = (d: Data) => d.content.map((b) => b.type)
const idOf = (b: { props: unknown }) => (b.props as { id: string }).id

// Blocks that gate themselves on words typed into the block, so a blank
// layout must leave them hidden. Hero is never gated, InquiryForm is a form,
// and the data-driven blocks stay empty until they fetch (they are gated too,
// but need no words from Tynnell).
const GATED_ON_WORDS = ['Statement', 'StatsRow', 'SplitImageText', 'PathChoice', 'Packages', 'Steps', 'FeatureColumns', 'Accordion', 'CTA']

describe.each(Object.entries(LAYOUTS))('blank layout for %s', (slug, build) => {
  const data = build(undefined)

  it('gives every block a unique id', () => {
    const ids = data.content.map(idOf)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('turns hide-until-filled on for every block that needs her words', () => {
    for (const b of data.content) {
      if (GATED_ON_WORDS.includes(b.type)) {
        expect((b.props as { hideUntilFilled?: boolean }).hideUntilFilled, `${slug}: ${idOf(b)}`).toBe(true)
      }
    }
  })

  it('shows a visitor no words at all until she fills something in', () => {
    const text = data.content
      .filter((b) => b.type !== 'InquiryForm')
      .map((b) => {
        const block = components[b.type]
        const { container } = render(block.render({ ...block.defaultProps, ...b.props, puck: {} }) as ReactElement)
        return container.textContent
      })
      .join('')

    expect(text).toBe('')
  })
})

describe('wedding page', () => {
  it('lists its sections in the Rising Roots order', () => {
    expect(types(buildWedding())).toEqual([
      'Hero',
      'SplitImageText',
      'Statement',
      'FeatureColumns',
      'SplitImageText',
      'Packages',
      'FeatureColumns',
      'Steps',
      'LiveTestimonials',
      'AlbumGrid',
      'InquiryForm',
      'CTA',
      'Accordion',
    ])
  })

  it('has a wedding inquiry form, wedding albums and a slider of testimonials', () => {
    const byId = Object.fromEntries(buildWedding().content.map((b) => [idOf(b), b.props as Record<string, unknown>]))

    expect(byId['wedding-inquiry'].kind).toBe('wedding')
    expect(byId['wedding-albums']).toMatchObject({ category: 'weddings', layout: 'grid' })
    expect(byId['wedding-kind-words'].stickyPhotoScroll).toBe('slider')
  })

  it('is registered for its page address and as a starter template', () => {
    expect(layoutForSlug('wedding-photography')).toEqual(buildWedding())
    expect(getTemplateContent('wedding')).toEqual(buildWedding())
  })
})

describe('portraits page', () => {
  it('lists its sections in the Rising Roots order', () => {
    expect(types(buildPortraits())).toEqual([
      'Hero',
      'Statement',
      'StatsRow',
      'Statement',
      'PathChoice',
      'SplitImageText',
      'Packages',
      'Steps',
      'CTA',
      'LiveTestimonials',
      'Accordion',
      'InquiryForm',
      'CTA',
    ])
  })

  it('has a portrait inquiry form, four session cards, and no album cards', () => {
    const data = buildPortraits()
    const byId = Object.fromEntries(data.content.map((b) => [idOf(b), b.props as Record<string, unknown>]))

    expect(byId['portraits-inquiry'].kind).toBe('portrait')
    expect(byId['portraits-sessions'].cards).toHaveLength(4)
    expect(types(data)).not.toContain('AlbumGrid')
  })

  it('shows no invented review count: the stats start blank', () => {
    const stats = buildPortraits().content.find((b) => b.type === 'StatsRow')!.props as { items: { value: string; label: string }[] }

    expect(stats.items.every((i) => i.value === '' && i.label === '')).toBe(true)
  })

  it('is registered for its page address and as a starter template', () => {
    expect(layoutForSlug('portraits')).toEqual(buildPortraits())
    expect(getTemplateContent('portraits')).toEqual(buildPortraits())
  })
})

describe('contact page', () => {
  it('lists its sections in order', () => {
    expect(types(buildContact())).toEqual(['Hero', 'InquiryForm', 'Statement', 'Accordion', 'LiveTestimonials'])
  })

  it('lets the visitor choose between the wedding and portrait form', () => {
    const form = buildContact().content.find((b) => b.type === 'InquiryForm')!.props as { kind: string }

    expect(form.kind).toBe('choice')
  })

  it('is registered for its page address', () => {
    expect(layoutForSlug('contact')).toEqual(buildContact())
  })
})

describe('layoutForSlug', () => {
  it('gives nothing for a page with no layout', () => {
    expect(layoutForSlug('nope')).toBeNull()
  })
})

describe('assertCanCreate', () => {
  it('passes for a slug with a layout that is not a page yet', () => {
    expect(() => assertCanCreate(['about', 'contact'], 'wedding-photography')).not.toThrow()
  })

  it('refuses to create a page that already exists', () => {
    expect(() => assertCanCreate(['about', 'wedding-photography'], 'wedding-photography')).toThrow(/already/)
  })

  it('refuses a slug with no layout', () => {
    expect(() => assertCanCreate([], 'nope')).toThrow(/no layout/)
  })
})

describe('assertCanDraft', () => {
  const row = { id: 7, slug: 'wedding-photography', draft_content: null as unknown }

  it('passes for a page with no saved draft', () => {
    expect(() => assertCanDraft(row, false)).not.toThrow()
  })

  it('refuses to overwrite a saved draft, except in a dry run', () => {
    const saved = { ...row, draft_content: { content: [], root: {} } }

    expect(() => assertCanDraft(saved, false)).toThrow(/draft/)
    expect(() => assertCanDraft(saved, true)).not.toThrow()
  })

  it('refuses a page whose slug has no layout', () => {
    expect(() => assertCanDraft({ ...row, slug: 'nope' }, true)).toThrow(/no layout/)
  })
})

describe('Hero height in layouts', () => {
  it('is one of the heights the editor offers, so its select shows the value', () => {
    const offered = components.Hero.fields.height.options.map((o: { value: string }) => o.value)
    for (const [slug, build] of Object.entries(LAYOUTS)) {
      for (const b of build(undefined).content.filter((x) => x.type === 'Hero')) {
        expect(offered, `${slug}`).toContain((b.props as { height: string }).height)
      }
    }
  })
})
