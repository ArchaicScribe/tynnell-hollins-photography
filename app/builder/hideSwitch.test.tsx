// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
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
  { type: 'Accordion', empty: { heading: '', items: [{ title: '', body: '' }] }, filled: { items: [{ title: 'Q', body: 'A' }] } },
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

describe('Email Signup hide switch', () => {
  const words = { heading: 'Free venue guide', body: 'Get the guide by email.' }

  it('is off by default, so existing pages do not change', () => {
    expect(components.EmailSignup.defaultProps.hideUntilFilled).toBe(false)
  })

  it('a freebie sign-up with words stays hidden until the guide link is ready', () => {
    for (const resolvedFreebieReady of [false, undefined]) {
      const { container, unmount } = renderBlock('EmailSignup', { ...words, kind: 'freebie', hideUntilFilled: true, resolvedFreebieReady })
      expect(container.innerHTML).toBe('')
      unmount()
    }
    const { container } = renderBlock('EmailSignup', { ...words, kind: 'freebie', hideUntilFilled: true, resolvedFreebieReady: true })
    expect(container.querySelector('section')).not.toBeNull()
  })

  it('a block saved without the switch is unaffected by readiness', () => {
    const { container } = renderBlock('EmailSignup', { ...words, kind: 'freebie', resolvedFreebieReady: false })

    expect(container.querySelector('section')).not.toBeNull()
  })

  it('a newsletter sign-up needs words but not a guide link', () => {
    const { container } = renderBlock('EmailSignup', { ...words, kind: 'newsletter', hideUntilFilled: true })
    expect(container.querySelector('section')).not.toBeNull()

    const blank = renderBlock('EmailSignup', { heading: '', body: '', kind: 'newsletter', hideUntilFilled: true })
    expect(blank.container.innerHTML).toBe('')
  })

  it('asks the server whether the guide is ready for the freebie type, and fails closed', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)
    try {
      const out = await components.EmailSignup.resolveData({ props: { kind: 'freebie' } })
      expect(out.props.resolvedFreebieReady).toBe(false)

      fetchMock.mockClear()
      const news = await components.EmailSignup.resolveData({ props: { kind: 'newsletter' } })
      expect(news.props.resolvedFreebieReady).toBe(true)
      expect(fetchMock).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('Split Image + Text without a photo', () => {
  const words = { body: 'A few words about me.', heading: 'Hello', layout: 'side-by-side', imageUrl: '' }

  it('keeps its empty photo frame when the switch is off, so existing pages do not change', () => {
    const { container } = renderBlock('SplitImageText', words)

    expect(container.querySelector('section')?.children).toHaveLength(2)
  })

  it('drops the empty photo frame when the switch is on, leaving just the text', () => {
    const { container } = renderBlock('SplitImageText', { ...words, hideUntilFilled: true })

    expect(container.querySelector('section')?.children).toHaveLength(1)
    expect(screen.getByText('A few words about me.')).toBeInTheDocument()
  })

  it('still shows the photo when there is one and the switch is on', () => {
    const { container } = renderBlock('SplitImageText', { ...words, imageUrl: '/me.jpg', hideUntilFilled: true })

    expect(container.querySelector('section')?.children).toHaveLength(2)
  })
})

describe('Split Image + Text without a photo, text column', () => {
  it('stays a readable width and keeps the button its own size', () => {
    renderBlock('SplitImageText', { layout: 'side-by-side', imageUrl: '', heading: 'Hello', body: 'About me.', buttonText: 'My Story', buttonHref: '/about', hideUntilFilled: true })

    const column = screen.getByRole('link', { name: 'My Story' }).parentElement!
    // A fixed 46rem basis caps the line length; flex-start stops the button
    // stretching to the column's full width (found on the Home preview).
    expect(column.style.flex).toContain('46rem')
    expect(column.style.alignItems).toBe('flex-start')
  })
})
