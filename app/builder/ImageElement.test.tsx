// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// TYN-347: the homepage hero is a Freeform Section whose photo is a full-bleed
// Image element with a dark overlay. Extra photos on that element rotate on a
// timer behind the overlay, so the heading and button stay put and readable.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const block = (config.components as Record<string, any>).ImageElement

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

function renderImage(props: Record<string, unknown>) {
  return render(block.render({ ...block.defaultProps, ...HERO, ...props, puck: {} }) as ReactElement)
}

// The photo on screen is the one at full opacity; the others sit at 0.
function shownPhoto(container: HTMLElement) {
  const shown = [...container.querySelectorAll('img')].filter((img) => img.style.opacity !== '0')
  expect(shown).toHaveLength(1)
  return shown[0].getAttribute('src')
}

const advance = (seconds: number) => act(() => { vi.advanceTimersByTime(seconds * 1000) })

describe('Image element photo rotation', () => {
  it('starts on the main photo and moves to the next one after the chosen number of seconds', () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }, { url: '/three.jpg' }], rotateSeconds: 6 })

    expect(shownPhoto(container)).toBe('/hero-background.jpg')
    advance(5.9)
    expect(shownPhoto(container)).toBe('/hero-background.jpg')
    advance(0.1)
    expect(shownPhoto(container)).toBe('/two.jpg')
  })

  it('goes back to the main photo after the last one', () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }], rotateSeconds: 4 })

    advance(4)
    expect(shownPhoto(container)).toBe('/two.jpg')
    advance(4)
    expect(shownPhoto(container)).toBe('/hero-background.jpg')
  })

  it('keeps the overlay over the rotating photos so text on top stays readable', () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }] })

    const overlay = [...container.querySelectorAll('div')].find((d) => d.style.opacity === '0.45')
    expect(overlay?.style.background).toBe('rgb(12, 12, 12)')
  })

  it('applies the focal point to every photo in the rotation', () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }], focalX: 30, focalY: 70 })

    const positions = [...container.querySelectorAll('img')].map((img) => img.style.objectPosition)
    expect(positions).toEqual(['30% 70%', '30% 70%'])
  })

  it('ignores extra photo slots that were added but never filled in', () => {
    const { container } = renderImage({ rotatePhotos: [{ url: '' }], rotateSeconds: 4 })

    advance(12)
    expect(container.querySelectorAll('img')).toHaveLength(1)
    expect(shownPhoto(container)).toBe('/hero-background.jpg')
  })

  it('stays on the main photo for visitors who ask their device to reduce motion', () => {
    reducedMotion = true
    const { container } = renderImage({ rotatePhotos: [{ url: '/two.jpg' }], rotateSeconds: 4 })

    advance(12)
    expect(shownPhoto(container)).toBe('/hero-background.jpg')
  })
})
