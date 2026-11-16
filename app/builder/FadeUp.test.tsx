// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { FadeUp } from './FadeUp'

// TYN-358: section content fades and lifts in once, when it first enters view.

let trigger: (isIntersecting: boolean) => void = () => {}

function stubEnvironment({ reduce = false, animations }: { reduce?: boolean; animations?: string } = {}) {
  vi.stubGlobal('matchMedia', () => ({ matches: reduce }))
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        trigger = (isIntersecting) => cb([{ isIntersecting }])
      }
      observe() {}
      disconnect() {}
    },
  )
  if (animations) document.documentElement.setAttribute('data-animations', animations)
  else document.documentElement.removeAttribute('data-animations')
}

const wrapper = () => screen.getByText('Hello').parentElement as HTMLElement

// jsdom has no layout: say where the content sits relative to an 800px viewport.
function placeAt(top: number) {
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top, height: 200, bottom: top + 200, left: 0, right: 0, width: 0, x: 0, y: top, toJSON() {},
  } as DOMRect)
}

describe('FadeUp', () => {
  beforeEach(() => stubEnvironment())
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.documentElement.removeAttribute('data-animations')
  })

  it('renders its children with no hiding style when disabled', () => {
    render(<FadeUp enabled={false}><p>Hello</p></FadeUp>)

    expect(wrapper().style.opacity).toBe('')
  })

  it('never hides content that is already in view when the page loads', () => {
    placeAt(100)
    render(<FadeUp enabled><p>Hello</p></FadeUp>)

    expect(wrapper().style.opacity).toBe('')
  })

  it('hides content below the fold, lowered, then reveals it once it enters the viewport', () => {
    placeAt(2000)
    render(<FadeUp enabled><p>Hello</p></FadeUp>)
    expect(wrapper().style.opacity).toBe('0')
    expect(wrapper().style.transform).toBe('translateY(24px)')

    act(() => trigger(true))

    expect(wrapper().style.opacity).toBe('1')
    expect(wrapper().style.transform).toBe('translateY(0)')
  })

  it('stays revealed after it leaves the viewport', () => {
    placeAt(2000)
    render(<FadeUp enabled><p>Hello</p></FadeUp>)
    act(() => trigger(true))
    act(() => trigger(false))

    expect(wrapper().style.opacity).toBe('1')
  })

  it('clears its transform once the fade has finished, so fixed overlays inside keep covering the viewport', () => {
    vi.useFakeTimers()
    try {
      placeAt(2000)
      render(<FadeUp enabled><p>Hello</p></FadeUp>)
      act(() => trigger(true))
      expect(wrapper().style.transform).toBe('translateY(0)')

      act(() => { vi.advanceTimersByTime(1500) })

      expect(wrapper().style.transform).toBe('')
      expect(wrapper().style.opacity).toBe('')
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows hidden content again when the control is switched off afterwards', () => {
    placeAt(2000)
    const { rerender } = render(<FadeUp enabled><p>Hello</p></FadeUp>)
    expect(wrapper().style.opacity).toBe('0')

    rerender(<FadeUp enabled={false}><p>Hello</p></FadeUp>)

    expect(wrapper().style.opacity).toBe('')
    expect(wrapper().style.transform).toBe('')
  })

  it('reveals when a not-intersecting entry is queued before an intersecting one', () => {
    placeAt(2000)
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          trigger = () => cb([{ isIntersecting: false }, { isIntersecting: true }])
        }
        observe() {}
        disconnect() {}
      },
    )
    render(<FadeUp enabled><p>Hello</p></FadeUp>)
    act(() => trigger(true))

    expect(wrapper().style.opacity).toBe('1')
  })

  it('shows content untouched where IntersectionObserver does not exist', () => {
    vi.unstubAllGlobals()
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    placeAt(2000)
    render(<FadeUp enabled><p>Hello</p></FadeUp>)

    expect(wrapper().style.opacity).toBe('')
  })

  it('shows immediately for reduced motion', () => {
    stubEnvironment({ reduce: true })
    placeAt(2000)
    render(<FadeUp enabled><p>Hello</p></FadeUp>)

    expect(wrapper().style.opacity).toBe('')
  })

  it('shows immediately when the /design animations switch is off', () => {
    stubEnvironment({ animations: 'off' })
    placeAt(2000)
    render(<FadeUp enabled><p>Hello</p></FadeUp>)

    expect(wrapper().style.opacity).toBe('')
  })
})
