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
