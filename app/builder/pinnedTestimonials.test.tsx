// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// The Kind words block gains the 'pinned' layout (the Rising Roots opening of the
// testimonials section), with an editable label and portrait caption.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const block = (config.components as Record<string, any>).LiveTestimonials
const quotes = [
  { id: 1, clientName: 'Ana', quote: 'Wonderful.', photoUrl: 'https://media.example/ana.jpg' },
  { id: 2, clientName: 'Ben', quote: 'So easy.', photoUrl: null },
]
const draw = (props: Record<string, unknown>) =>
  render(block.render({ ...block.defaultProps, resolvedTestimonials: quotes, puck: {}, ...props }) as ReactElement)

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} unobserve() {} })
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { fn(0); return 1 })
})
afterEach(() => vi.unstubAllGlobals())

describe('LiveTestimonials pinned layout', () => {
  it('offers the pinned layout in the Layout picker', () => {
    const values = (block.fields.stickyPhotoScroll.options as { value: unknown }[]).map((o) => o.value)

    expect(values).toContain('pinned')
  })

  it('has an editable label and portrait caption, defaulting to the reference wording', () => {
    expect(block.fields.kindWordsLabel.type).toBe('text')
    expect(block.fields.photoCaption.type).toBe('text')
    expect(block.defaultProps.kindWordsLabel).toBe('Kind words')
    expect(block.defaultProps.photoCaption).toBe('From kinder people')
  })

  it('shows the label and caption it was given', () => {
    draw({ stickyPhotoScroll: 'pinned', kindWordsLabel: 'Love notes', photoCaption: 'From my couples' })

    expect(screen.getByText('Love notes')).toBeInTheDocument()
    expect(screen.getByText('From my couples')).toBeInTheDocument()
  })

  it('leaves out the label and caption when they are cleared', () => {
    draw({ stickyPhotoScroll: 'pinned', kindWordsLabel: '', photoCaption: '' })

    expect(screen.queryByText('Kind words')).toBeNull()
    expect(screen.queryByText('From kinder people')).toBeNull()
  })

  it('turns the text light when the block has a background photo, and not otherwise', () => {
    const withPhoto = draw({ stickyPhotoScroll: 'pinned', backgroundImage: '/bg.jpg' }).container
    const without = draw({ stickyPhotoScroll: 'pinned', backgroundImage: '' }).container

    expect(withPhoto.querySelector('[class*="onPhoto"]')).not.toBeNull()
    expect(without.querySelector('[class*="onPhoto"]')).toBeNull()
  })

  it('does not change the other layouts', () => {
    draw({ stickyPhotoScroll: false })

    expect(screen.queryByText('Kind words')).toBeNull()
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })
})
