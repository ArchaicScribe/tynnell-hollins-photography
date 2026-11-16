// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import TestimonialsList, { type TestimonialItem } from './TestimonialsList'

// Pins down the sticky-photo layout (TYN-354) before its scroll tracking moved
// to the shared useActiveOnScroll hook, so the move cannot change behavior.
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
  { id: 1, clientName: 'Ana', quote: 'Wonderful.', photoUrl: 'https://media.example/ana.jpg' },
  { id: 2, clientName: 'Ben', quote: 'So easy.', photoUrl: 'https://media.example/ben.jpg' },
  { id: 3, clientName: 'Cai', quote: 'Loved it.', photoUrl: null },
]

const pinnedPhoto = () => screen.getByRole('img')

describe('TestimonialsList sticky photo layout', () => {
  beforeEach(() => vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver))
  afterEach(() => vi.unstubAllGlobals())

  it('starts on the first testimonial photo', () => {
    render(<TestimonialsList testimonials={testimonials} stickyPhotoScroll />)

    expect(pinnedPhoto()).toHaveAttribute('alt', 'Ana session')
  })

  it('swaps to the photo of the testimonial scrolled into view', () => {
    render(<TestimonialsList testimonials={testimonials} stickyPhotoScroll />)

    act(() => fireIntersection(screen.getByRole('article', { name: 'Review from Ben' })))

    expect(pinnedPhoto()).toHaveAttribute('alt', 'Ben session')
  })

  it('keeps the last photo for a testimonial that has none', () => {
    render(<TestimonialsList testimonials={testimonials} stickyPhotoScroll />)

    act(() => fireIntersection(screen.getByRole('article', { name: 'Review from Ben' })))
    act(() => fireIntersection(screen.getByRole('article', { name: 'Review from Cai' })))

    expect(pinnedPhoto()).toHaveAttribute('alt', 'Ben session')
  })
})

describe('TestimonialsList slider layout', () => {
  beforeEach(() => vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver))
  afterEach(() => vi.unstubAllGlobals())

  it('uses the numbered slider when asked and there are two or more testimonials', () => {
    render(<TestimonialsList testimonials={testimonials} stickyPhotoScroll="slider" />)

    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['01', '02', '03'])
  })

  it('falls back to the plain list with exactly one testimonial, with no lone control', () => {
    render(<TestimonialsList testimonials={[testimonials[0]]} stickyPhotoScroll="slider" />)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getByRole('article', { name: 'Review from Ana' })).toBeInTheDocument()
  })

  it('the value slider does not switch on the sticky photo layout', () => {
    render(<TestimonialsList testimonials={[testimonials[0], testimonials[1]]} stickyPhotoScroll="slider" />)

    // The sticky layout renders every quote as an article; the slider shows one.
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })
})
