import { describe, it, expect } from 'vitest'
import type { Data } from '@measured/puck'
import { editorSnapshot } from './editorSnapshot'

const same = (a: Data, b: Data) => editorSnapshot(a) === editorSnapshot(b)

const saved: Data = {
  root: { props: { title: 'Home' } },
  content: [
    { type: 'Text', props: { id: 't1', text: 'Hello' } },
    { type: 'PortfolioGrid', props: { id: 'g1', category: 'all' } },
  ],
}

describe('editorSnapshot', () => {
  it('ignores live data that resolveData fills into resolved* props on load', () => {
    const loaded: Data = {
      ...saved,
      content: [
        saved.content[0],
        { type: 'PortfolioGrid', props: { id: 'g1', category: 'all', resolvedPhotos: [{ id: 9 }] } },
      ],
    }
    expect(same(saved, loaded)).toBe(true)
  })

  it('ignores resolved* props on blocks nested inside another block', () => {
    const nest = (inner: Record<string, unknown>): Data => ({
      root: { props: {} },
      content: [{ type: 'FreeformSection', props: { id: 'f1', items: [{ type: 'LiveServices', props: { id: 's1', ...inner } }] } }],
    })
    expect(same(nest({}), nest({ resolvedServices: [{ id: 1 }] }))).toBe(true)
  })

  it('ignores resolved* props in legacy zones', () => {
    const zoned = (inner: Record<string, unknown>): Data => ({
      root: { props: {} },
      content: [],
      zones: { 'a:b': [{ type: 'LiveBlog', props: { id: 'b1', ...inner } }] },
    })
    expect(same(zoned({}), zoned({ resolvedPosts: [], resolvedCategories: [] }))).toBe(true)
  })

  it("treats Puck rewriting an empty root from {} to { props: {} } as no change", () => {
    expect(same({ root: {}, content: [] }, { root: { props: {} }, content: [] })).toBe(true)
  })

  it('treats Puck moving legacy root fields into root.props as no change', () => {
    expect(same({ root: { title: 'Home' } as Data['root'], content: [] }, { root: { props: { title: 'Home' } }, content: [] })).toBe(true)
  })

  it('ignores the order props are listed in', () => {
    const reordered: Data = {
      ...saved,
      content: [{ type: 'Text', props: { text: 'Hello', id: 't1' } }, saved.content[1]],
    }
    expect(same(saved, reordered)).toBe(true)
  })

  it('reports an edited prop as a change', () => {
    const edited: Data = { ...saved, content: [{ type: 'Text', props: { id: 't1', text: 'Hello there' } }, saved.content[1]] }
    expect(same(saved, edited)).toBe(false)
  })

  it('reports an edited root prop as a change', () => {
    expect(same(saved, { ...saved, root: { props: { title: 'Welcome' } } })).toBe(false)
  })

  it('reports an added block as a change', () => {
    expect(same(saved, { ...saved, content: [...saved.content, { type: 'Spacer', props: { id: 'sp' } }] })).toBe(false)
  })

  it('reports reordered blocks as a change', () => {
    expect(same(saved, { ...saved, content: [saved.content[1], saved.content[0]] })).toBe(false)
  })
})
