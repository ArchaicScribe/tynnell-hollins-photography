// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element -- plain <img> stands in for a photo child */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ParallaxLayer } from './ParallaxLayer'

// TYN-358. jsdom has no layout, so the frame's rect, the viewport height,
// IntersectionObserver and requestAnimationFrame are all stubbed.

function stubEnvironment({ reduce = false, animations }: { reduce?: boolean; animations?: string } = {}) {
  vi.stubGlobal('matchMedia', () => ({ matches: reduce, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private cb: (entries: { isIntersecting: boolean }[]) => void) {}
      observe() { this.cb([{ isIntersecting: true }]) }
      disconnect() {}
    },
  )
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { fn(0); return 1 })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
  if (animations) document.documentElement.setAttribute('data-animations', animations)
  else document.documentElement.removeAttribute('data-animations')
}

function placeFrame(top: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top, height: 400, bottom: top + 400, left: 0, right: 0, width: 0, x: 0, y: top, toJSON() {},
  } as DOMRect)
}

const layer = (container: HTMLElement) => container.querySelector('[data-parallax-layer]') as HTMLElement

describe('ParallaxLayer', () => {
  beforeEach(() => stubEnvironment())
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.documentElement.removeAttribute('data-animations')
  })

  it('renders its children untouched, with no wrapper, when movement is none or unset', () => {
    const { container, rerender } = render(<ParallaxLayer level="none"><img alt="" src="/a.jpg" /></ParallaxLayer>)
    expect(container.firstElementChild?.tagName).toBe('IMG')

    rerender(<ParallaxLayer><img alt="" src="/a.jpg" /></ParallaxLayer>)
    expect(container.firstElementChild?.tagName).toBe('IMG')
  })

  it('oversizes the layer by twice the range so the frame never shows a gap', () => {
    placeFrame(200)
    const { container } = render(<ParallaxLayer level="medium"><img alt="" src="/a.jpg" /></ParallaxLayer>)

    expect(layer(container).style.top).toBe('-15%')
    expect(layer(container).style.height).toBe('130%')
    expect(layer(container).parentElement?.style.overflow).toBe('hidden')
  })

  // Where the layer's edges land inside a frame of height 1, in frame heights.
  // translate percentages are of the layer's own height.
  function edges(container: HTMLElement) {
    const el = layer(container)
    const top = parseFloat(el.style.top) / 100
    const height = parseFloat(el.style.height) / 100
    const shift = (parseFloat(/translate3d\(0, (-?[\d.]+)%/.exec(el.style.transform)![1]) / 100) * height
    return { top: top + shift, bottom: top + shift + height }
  }

  it('moves the layer down while the frame enters and up as it leaves, never leaving a gap', () => {
    placeFrame(800) // top meets the bottom of the viewport: progress 0
    const { container } = render(<ParallaxLayer level="medium"><img alt="" src="/a.jpg" /></ParallaxLayer>)
    const entering = edges(container)
    expect(entering.top).toBeCloseTo(0) // as far down as it may go, still covering the top edge
    expect(entering.bottom).toBeGreaterThanOrEqual(1)

    placeFrame(-400) // bottom meets the top of the viewport: progress 1
    fireEvent.scroll(window)
    const leaving = edges(container)
    expect(leaving.bottom).toBeCloseTo(1) // as far up as it may go, still covering the bottom edge
    expect(leaving.top).toBeLessThanOrEqual(0)
  })

  it('never leaves a gap for any movement level at any scroll position', () => {
    for (const level of ['gentle', 'medium', 'strong'] as const) {
      for (const top of [800, 600, 400, 200, 0, -200, -400]) {
        placeFrame(top)
        const { container, unmount } = render(<ParallaxLayer level={level}><img alt="" src="/a.jpg" /></ParallaxLayer>)
        const { top: t, bottom: b } = edges(container)
        // pct() rounds to 3 decimals, so allow 0.01% of the frame height (far under a pixel)
        expect(t).toBeLessThanOrEqual(1e-4)
        expect(b).toBeGreaterThanOrEqual(1 - 1e-4)
        unmount()
      }
    }
  })

  it('travels further for strong than gentle', () => {
    placeFrame(800)
    const gentle = render(<ParallaxLayer level="gentle"><img alt="" src="/a.jpg" /></ParallaxLayer>)
    const strong = render(<ParallaxLayer level="strong"><img alt="" src="/a.jpg" /></ParallaxLayer>)

    const px = (c: HTMLElement) => parseFloat(/translate3d\(0, (-?[\d.]+)%/.exec(layer(c).style.transform)![1]) * parseFloat(layer(c).style.height)
    expect(px(strong.container)).toBeGreaterThan(px(gentle.container))
  })

  it('does not move for reduced motion', () => {
    stubEnvironment({ reduce: true })
    placeFrame(800)
    const { container } = render(<ParallaxLayer level="strong"><img alt="" src="/a.jpg" /></ParallaxLayer>)
    fireEvent.scroll(window)

    expect(layer(container).style.transform).toBe('')
  })

  it('does not move when the /design animations switch is off', () => {
    stubEnvironment({ animations: 'off' })
    placeFrame(800)
    const { container } = render(<ParallaxLayer level="strong"><img alt="" src="/a.jpg" /></ParallaxLayer>)
    fireEvent.scroll(window)

    expect(layer(container).style.transform).toBe('')
  })

  it('still renders and moves where IntersectionObserver does not exist', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    placeFrame(800)
    const { container } = render(<ParallaxLayer level="medium"><img alt="" src="/a.jpg" /></ParallaxLayer>)

    expect(layer(container).style.transform).toMatch(/^translate3d\(0, [1-9]/)
  })

  it('cancels a pending animation frame when unmounted', () => {
    placeFrame(800)
    const cancel = vi.fn()
    vi.stubGlobal('requestAnimationFrame', () => 42) // never runs, so one stays pending
    vi.stubGlobal('cancelAnimationFrame', cancel)
    const { unmount } = render(<ParallaxLayer level="medium"><img alt="" src="/a.jpg" /></ParallaxLayer>)
    fireEvent.scroll(window)
    unmount()

    expect(cancel).toHaveBeenCalledWith(42)
  })

  it('stops listening to scroll when unmounted', () => {
    placeFrame(800)
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<ParallaxLayer level="medium"><img alt="" src="/a.jpg" /></ParallaxLayer>)
    unmount()

    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})
