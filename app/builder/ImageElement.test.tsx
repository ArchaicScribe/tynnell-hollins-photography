// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// TYN-347: the homepage hero is a Freeform Section whose photo is a full-bleed
// Image element with a dark overlay. Extra photos on that element rotate on a
// timer behind the overlay, so the heading and button stay put and readable.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blocks = config.components as Record<string, any>
const block = blocks.ImageElement

const HERO = {
  url: '/hero-background.jpg',
  x: 0, y: 0, width: 100, height: 100,
  overlayColor: '#0C0C0C', overlayOpacity: 45,
}

let reducedMotion = false

beforeEach(() => {
  vi.useFakeTimers()
  reducedMotion = false
  window.matchMedia = ((media: string) => ({
    matches: media.includes('prefers-reduced-motion') && reducedMotion,
    media,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  })) as unknown as typeof window.matchMedia
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const imageElement = (props: Record<string, unknown>) =>
  block.render({ ...block.defaultProps, ...HERO, ...props, puck: {} }) as ReactElement

const renderImage = (props: Record<string, unknown>) => render(imageElement(props))

const photos = (container: HTMLElement) => [...container.querySelectorAll('img')]

// The photo a visitor sees is the topmost one that is not transparent.
function shownPhoto(container: HTMLElement) {
  const visible = photos(container).filter((img) => img.style.opacity !== '0')
  expect(visible.length).toBeGreaterThan(0)
  const top = visible.reduce((a, b) => (Number(b.style.zIndex || 0) > Number(a.style.zIndex || 0) ? b : a))
  return top.getAttribute('src')
}

const photo = (container: HTMLElement, src: string) => photos(container).find((img) => img.getAttribute('src') === src)!

const advance = (seconds: number) => act(() => { vi.advanceTimersByTime(seconds * 1000) })

describe('Image element photo rotation', () => {
  it('starts on the main photo and moves to the next one after the chosen number of seconds', () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }, { url: '/three.jpg' }], rotateSeconds: 8 })

    expect(shownPhoto(container)).toBe('/hero-background.jpg')
    advance(7.9)
    expect(shownPhoto(container)).toBe('/hero-background.jpg')
    advance(0.1)
    expect(shownPhoto(container)).toBe('/two.jpg')
  })

  it('goes back to the main photo after the last one', () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }], rotateSeconds: 6 })

    advance(6)
    expect(shownPhoto(container)).toBe('/two.jpg')
    advance(6)
    expect(shownPhoto(container)).toBe('/hero-background.jpg')
  })

  // The live hero was saved before rotation existed, so it has no timing
  // value. The public site renders saved data without defaults, and the
  // editor's dropdown shows its first option for a missing value, so that
  // first option must be the timing the page actually uses.
  it('uses the timing the editor shows first when the saved element has none', () => {
    const firstOption = block.fields.rotateSeconds.options[0].value
    const saved = { ...HERO, rotatePhotos: [{ url: '/two.jpg' }], puck: {} }
    const { container } = render(block.render(saved) as ReactElement)

    advance(firstOption - 0.1)
    expect(shownPhoto(container)).toBe('/hero-background.jpg')
    advance(0.1)
    expect(shownPhoto(container)).toBe('/two.jpg')
  })

  // Fading one photo out while the next fades in lets the page behind show
  // through mid-fade. The outgoing photo stays solid underneath instead.
  it('keeps the previous photo fully shown underneath while the next one fades in on top', () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }], rotateSeconds: 6 })

    advance(6)
    const incoming = photo(container, '/two.jpg')
    const outgoing = photo(container, '/hero-background.jpg')
    expect(outgoing.style.opacity).toBe('1')
    expect(Number(incoming.style.zIndex)).toBeGreaterThan(Number(outgoing.style.zIndex))
  })

  // Once the fade is over, the photo underneath must clear. Otherwise, with
  // two photos, the main photo would still be solid when its turn comes back
  // and would cut in instead of fading in.
  it('clears the previous photo once the fade is over, so with two photos each one fades back in', () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }], rotateSeconds: 6 })

    advance(6)
    advance(1)
    expect(photo(container, '/hero-background.jpg').style.opacity).toBe('0')
  })

  it('keeps the overlay over the rotating photos so text on top stays readable', () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }] })

    const overlay = [...container.querySelectorAll('div')].find((d) => d.style.opacity === '0.45')
    expect(overlay?.style.background).toBe('rgb(12, 12, 12)')
  })

  it("uses the main photo's focal point for rotated photos that have none of their own", () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }], focalX: 30, focalY: 70 })

    expect(photos(container).map((img) => img.style.objectPosition)).toEqual(['30% 70%', '30% 70%'])
  })

  it("uses a rotated photo's own focal point when it has one", () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg', focalX: 20, focalY: 80 }], focalX: 30, focalY: 70 })

    expect(photo(container, '/two.jpg').style.objectPosition).toBe('20% 80%')
  })

  it('ignores extra photo slots that were added but never filled in', () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '' }], rotateSeconds: 6 })

    advance(18)
    expect(photos(container)).toHaveLength(1)
    expect(shownPhoto(container)).toBe('/hero-background.jpg')
  })

  it('still shows a photo when photos are removed while it is rotating', () => {
    const three = [{ url: '/two.jpg' }, { url: '/three.jpg' }]
    const { container, rerender } = renderImage({ rotatePhotos: three, rotateSeconds: 6 })
    advance(12)
    expect(shownPhoto(container)).toBe('/three.jpg')

    rerender(imageElement({ rotatePhotos: [{ url: '/two.jpg' }], rotateSeconds: 6 }))
    expect(photos(container).some((img) => img.style.opacity !== '0')).toBe(true)
  })

  it("keeps the main photo's alt text available to screen readers whichever photo is showing", () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }], rotateSeconds: 6, alt: 'Bride walking through a field' })

    advance(6)
    const main = photo(container, '/hero-background.jpg')
    expect(main.getAttribute('alt')).toBe('Bride walking through a field')
    expect(main.getAttribute('aria-hidden')).toBeNull()
    expect(photo(container, '/two.jpg').getAttribute('aria-hidden')).toBe('true')
  })

  it('loads the extra photos at low priority so the main photo paints first', () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }, { url: '/three.jpg' }] })

    expect(photos(container).map((img) => img.getAttribute('fetchpriority'))).toEqual([null, 'low', 'low'])
  })

  it('stays on the main photo for visitors who ask their device to reduce motion', () => {
    reducedMotion = true
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }], rotateSeconds: 6 })

    advance(18)
    expect(shownPhoto(container)).toBe('/hero-background.jpg')
  })
})

// The Image Slideshow element's photos are its content, not a backdrop, so
// stopping it for reduced motion would hide every photo but the first.
describe('Image Slideshow element', () => {
  it('keeps advancing for visitors who ask their device to reduce motion', () => {
    reducedMotion = true
    const slideshow = blocks.ImageSlideshowElement
    const { container } = render(
      slideshow.render({ ...slideshow.defaultProps, images: [{ url: '/a.jpg' }, { url: '/b.jpg' }], puck: {} }) as ReactElement,
    )

    advance(4)
    expect(shownPhoto(container)).toBe('/b.jpg')
  })
})
