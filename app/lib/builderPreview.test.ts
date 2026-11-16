import { describe, it, expect, vi } from 'vitest'

vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: false }) }))

import { pageRenderData } from './builderPreview'

// Every builder page (promoted routes and the catch-all) is prepared here, so
// this is where the page says whether it opens on a full-bleed photo.
describe('pageRenderData', () => {
  it('flags a first-block hero so the nav can stay transparent over it', async () => {
    const data = await pageRenderData({ content: { content: [{ type: 'Hero', props: { id: 'h', imageUrl: '/a.jpg' } }], root: {} } })
    expect((data.content[0].props as { navHero?: boolean }).navHero).toBe(true)
  })

  it('does not flag a page that opens on something else', async () => {
    const data = await pageRenderData({
      content: { content: [{ type: 'SectionHeading', props: { id: 's' } }, { type: 'FullWidthImage', props: { id: 'f', imageUrl: '/a.jpg' } }], root: {} },
    })
    expect(data.content.map((c) => (c.props as { navHero?: boolean }).navHero)).toEqual([undefined, undefined])
  })

  it('returns an empty page when there is no content', async () => {
    expect((await pageRenderData({})).content).toEqual([])
  })
})
