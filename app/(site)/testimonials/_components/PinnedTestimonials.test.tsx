// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { readFileSync } from 'fs'
import path from 'path'
import TestimonialsList, { type TestimonialItem } from './TestimonialsList'

// The Rising Roots "Kind words" section (2026-11-24): a small label top left, one portrait
// pinned on the left (with a caption) that swaps as each quote scrolls into the middle, and
// large light quotes scrolling past on the right, over a full-width photo behind the section.
// It is the 'pinned' value of the Layout option, next to the plain list, sticky photo and slider.
let fireIntersection: (target: Element) => void
class FakeIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    fireIntersection = (target) =>
      cb(
        [{ isIntersecting: true, target, boundingClientRect: { top: 0 } } as unknown as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      )
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const testimonials: TestimonialItem[] = [
  { id: 1, clientName: 'Ana & Joe', quote: 'Wonderful.', photoUrl: 'https://media.example/ana.jpg' },
  { id: 2, clientName: 'Ben', quote: 'So easy.', photoUrl: 'https://media.example/ben.jpg' },
  { id: 3, clientName: 'Cai', quote: 'Loved it.', photoUrl: null },
]

const draw = (props: Record<string, unknown> = {}, list = testimonials) =>
  render(<TestimonialsList testimonials={list} stickyPhotoScroll="pinned" {...props} />)

describe('TestimonialsList pinned layout', () => {
  beforeEach(() => vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver))
  afterEach(() => vi.unstubAllGlobals())

  it('shows every quote with the client name, and the section label', () => {
    draw({ label: 'Kind words' })

    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.getByRole('article', { name: 'Review from Ana & Joe' })).toHaveTextContent('Wonderful.')
    expect(screen.getByRole('article', { name: 'Review from Ana & Joe' })).toHaveTextContent('Ana & Joe')
    expect(screen.getByText('Kind words')).toBeInTheDocument()
  })

  it('pins the first portrait with its caption, and swaps it as a quote scrolls into view', () => {
    draw({ caption: 'From kinder people' })

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Ana & Joe session')
    expect(screen.getByText('From kinder people')).toBeInTheDocument()

    act(() => fireIntersection(screen.getByRole('article', { name: 'Review from Ben' })))
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Ben session')
  })

  it('keeps the last portrait for a quote that has none', () => {
    draw()

    act(() => fireIntersection(screen.getByRole('article', { name: 'Review from Ben' })))
    act(() => fireIntersection(screen.getByRole('article', { name: 'Review from Cai' })))

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Ben session')
  })

  it('shows the first portrait from the start even when the first quote has none, so the column never pops in', () => {
    draw({ caption: 'From kinder people' }, [{ ...testimonials[0], photoUrl: null }, testimonials[1]])

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Ben session')
    expect(screen.getByText('From kinder people')).toBeInTheDocument()
  })

  it('with no portraits at all shows the quotes alone, with no empty frame or caption', () => {
    draw({ caption: 'From kinder people' }, testimonials.map((t) => ({ ...t, photoUrl: null })))

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.queryByText('From kinder people')).toBeNull()
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('works with a single quote, where the slider would fall back to a list', () => {
    draw({}, [testimonials[0]])

    expect(screen.getByRole('article', { name: 'Review from Ana & Joe' })).toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('switches to light text only when a photo sits behind it', () => {
    const plain = draw().container.firstElementChild!
    const onPhoto = draw({ onPhoto: true }).container.firstElementChild!

    expect(plain.className).not.toContain('onPhoto')
    expect(onPhoto.className).toContain('onPhoto')
  })
})

// CSS modules do not apply in jsdom, so the look is checked from the stylesheet text.
const css = readFileSync(path.resolve(__dirname, 'PinnedTestimonials.module.css'), 'utf8')
const bodyOf = (selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => m[1].replace(/\/\*[\s\S]*?\*\//g, '').split(',').map((s) => s.trim()).includes(selector))
    .map((m) => m[2])
    .join(' ')

describe('pinned testimonials stylesheet', () => {
  it('pins the portrait column while the quotes scroll', () => {
    expect(bodyOf('.photoCol')).toMatch(/position:\s*sticky/)
  })

  it('sets the quotes large, light and upright like the reference, not bold or italic', () => {
    const quote = bodyOf('.quote')
    expect(quote).toMatch(/font-weight:\s*(300|400)/)
    expect(quote).not.toMatch(/font-style:\s*italic/)
    expect(quote).toMatch(/font-size:\s*clamp\(/)
  })

  it('uses a light ink only in the on-photo state', () => {
    expect(bodyOf('.onPhoto')).toMatch(/color:\s*#ECE9E0/i)
    expect(bodyOf('.root')).not.toMatch(/#ECE9E0/i)
  })

  it('stacks the portrait over the quotes on a phone and stops pinning it', () => {
    expect(css).toMatch(/@media \(max-width:\s*\d+px\)\s*\{[\s\S]*\.photoCol\s*\{[^}]*position:\s*static/)
  })
})
