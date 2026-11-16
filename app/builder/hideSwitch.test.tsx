// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// The "Hide until filled in" switch on blocks that already existed. It must be
// OFF by default so every saved page renders as it did before the switch.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components = config.components as Record<string, any>

function renderBlock(type: string, props: Record<string, unknown>, puck: Record<string, unknown> = {}) {
  const block = components[type]
  return render(block.render({ ...block.defaultProps, ...props, puck }) as ReactElement)
}

const cases: { type: string; empty: Record<string, unknown>; filled: Record<string, unknown> }[] = [
  { type: 'SplitImageText', empty: { body: '', buttonText: '' }, filled: { body: 'Hello there' } },
  { type: 'CTA', empty: { heading: '' }, filled: { heading: 'Book now' } },
  { type: 'AlbumGrid', empty: { resolvedAlbums: [] }, filled: { resolvedAlbums: [{ id: 1, slug: 'june', title: 'June', coverUrl: null, coverAlt: '', previewUrls: [], photoCount: 3 }] } },
  { type: 'LiveTestimonials', empty: { resolvedTestimonials: [] }, filled: { resolvedTestimonials: [{ id: 1, clientName: 'Ana', quote: 'Wonderful.' }] } },
  { type: 'StatsRow', empty: { items: [{ value: '', label: '' }] }, filled: { items: [{ value: '150+', label: 'Weddings' }] } },
]

describe.each(cases)('$type hide switch', ({ type, empty, filled }) => {
  it('is off by default, so existing pages do not change', () => {
    expect(components[type].defaultProps.hideUntilFilled).toBe(false)
  })

  it('still renders a section when empty and the switch is off', () => {
    const { container } = renderBlock(type, empty)

    expect(container.querySelector('section')).not.toBeNull()
  })

  it('renders nothing for a visitor when empty and the switch is on', () => {
    const { container } = renderBlock(type, { ...empty, hideUntilFilled: true })

    expect(container.innerHTML).toBe('')
  })

  it('shows the dashed outline in the editor when empty and the switch is on', () => {
    renderBlock(type, { ...empty, hideUntilFilled: true }, { isEditing: true })

    expect(screen.getByText(/Add your words here:/)).toBeInTheDocument()
  })

  it('renders normally when filled and the switch is on', () => {
    const { container } = renderBlock(type, { ...filled, hideUntilFilled: true })

    expect(container.querySelector('section')).not.toBeNull()
    expect(container.querySelector('[data-empty-outline]')).toBeNull()
  })
})
