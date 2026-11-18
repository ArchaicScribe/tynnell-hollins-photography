// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ScrollCrossfade } from './ScrollCrossfade'

// Step 5. jsdom has no layout, so the frame's rect, the viewport height,
// IntersectionObserver and requestAnimationFrame are stubbed (as in
// ParallaxLayer.test.tsx).

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

const photos = [{ url: '/a.jpg' }, { url: '/b.jpg' }, { url: '/c.jpg' }]
const layers = (c: HTMLElement) => [...c.querySelectorAll<HTMLImageElement>('[data-crossfade-layer]')]
const opacities = (c: HTMLElement) => layers(c).map((l) => Number(l.style.opacity))

describe('ScrollCrossfade', () => {
  beforeEach(() => stubEnvironment())
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.documentElement.removeAttribute('data-animations')
  })

  it('stacks every photo in order and shows only the first before any scrolling', () => {
    placeFrame(800) // frame just below the viewport: progress 0
    const { container } = render(<ScrollCrossfade images={photos} alt="Tynnell" />)

    expect(layers(container).map((l) => l.getAttribute('src'))).toEqual(['/a.jpg', '/b.jpg', '/c.jpg'])
    expect(opacities(container)).toEqual([1, 0, 0])
  })

  it('fades the later photos in as the frame scrolls up through the viewport', () => {
    placeFrame(800)
    const { container } = render(<ScrollCrossfade images={photos} />)

    placeFrame(200) // progress 0.5: both upper photos should now be fully in or on their way
    fireEvent.scroll(window)
    const mid = opacities(container)
    expect(mid[0]).toBe(1)
    expect(mid[1]).toBe(1)

    placeFrame(-400) // progress 1
    fireEvent.scroll(window)
    expect(opacities(container)).toEqual([1, 1, 1])
  })

  it('describes the first photo only, so screen readers do not read every one', () => {
    placeFrame(800)
    const { container } = render(<ScrollCrossfade images={photos} alt="Tynnell with her camera" />)

    const [first, second, third] = layers(container)
    expect(first.getAttribute('alt')).toBe('Tynnell with her camera')
    expect(second.getAttribute('alt')).toBe('')
    expect(second.getAttribute('aria-hidden')).toBe('true')
    expect(third.getAttribute('aria-hidden')).toBe('true')
  })

  it('stays on the first photo for reduced motion', () => {
    stubEnvironment({ reduce: true })
    placeFrame(-400)
    const { container } = render(<ScrollCrossfade images={photos} />)
    fireEvent.scroll(window)

    expect(opacities(container)).toEqual([1, 0, 0])
  })

  it('stays on the first photo when the /design animations switch is off', () => {
    stubEnvironment({ animations: 'off' })
    placeFrame(-400)
    const { container } = render(<ScrollCrossfade images={photos} />)
    fireEvent.scroll(window)

    expect(opacities(container)).toEqual([1, 0, 0])
  })

  it('goes back to the first photo when animations are switched off after it moved', () => {
    placeFrame(-400)
    const { container } = render(<ScrollCrossfade images={photos} />)
    expect(opacities(container)).toEqual([1, 1, 1])

    document.documentElement.setAttribute('data-animations', 'off')
    fireEvent.scroll(window)
    expect(opacities(container)).toEqual([1, 0, 0])
  })

  it('renders one plain photo, with no crossfade layers behaving oddly, when given just one', () => {
    placeFrame(800)
    const { container } = render(<ScrollCrossfade images={[{ url: '/only.jpg' }]} />)

    expect(opacities(container)).toEqual([1])
  })

  it('renders nothing for an empty list', () => {
    const { container } = render(<ScrollCrossfade images={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('still drives the right photos after one is swapped for another of the same count', () => {
    // In the editor Tynnell replaces a photo: the keys change so React mounts a
    // new <img> while the count stays the same. The new layer must still fade in.
    placeFrame(-400) // progress 1: every layer should be fully on
    const { container, rerender } = render(<ScrollCrossfade images={photos} />)
    expect(opacities(container)).toEqual([1, 1, 1])

    rerender(<ScrollCrossfade images={[photos[0], { url: '/swapped.jpg' }, photos[2]]} />)
    fireEvent.scroll(window)

    expect(layers(container).map((l) => l.getAttribute('src'))).toEqual(['/a.jpg', '/swapped.jpg', '/c.jpg'])
    expect(opacities(container)).toEqual([1, 1, 1])
  })

  it('stops listening to scroll when unmounted', () => {
    placeFrame(800)
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<ScrollCrossfade images={photos} />)
    unmount()

    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})
