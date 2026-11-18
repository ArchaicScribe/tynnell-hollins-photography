// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// Step 5, item 5: the Hero photo can drift as the page scrolls, with the same
// Photo movement choice every other block has.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hero = (config.components as Record<string, any>).Hero

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { fn(0); return 1 })
})
afterEach(() => vi.unstubAllGlobals())

const draw = (props: Record<string, unknown>) =>
  render(hero.render({ ...hero.defaultProps, imageUrl: '/a.jpg', heading: 'Hi', ...props, puck: {} }) as ReactElement).container
const moving = (c: HTMLElement) => c.querySelector('[data-parallax-layer]')

describe('Hero photo movement', () => {
  it('offers the same Photo movement choice as the other blocks, defaulting to gentle for new heroes', () => {
    const field = hero.fields.photoMovement
    expect(field.label).toBe('Photo movement on scroll')
    expect(field.options.map((o: { value: string }) => o.value)).toEqual(['none', 'gentle', 'medium', 'strong'])
    expect(hero.defaultProps.photoMovement).toBe('gentle')
  })

  it.each(['bottom', 'centered', 'split'])('moves the photo in the %s layout when set', (layout) => {
    const c = draw({ layout, photoMovement: 'gentle' })
    expect(moving(c)).not.toBeNull()
    expect(moving(c)!.querySelector('img')!.getAttribute('src')).toBe('/a.jpg')
  })

  it('leaves the photo still when set to None, and for heroes saved before the control existed', () => {
    expect(moving(draw({ photoMovement: 'none' }))).toBeNull()
    expect(moving(draw({ photoMovement: undefined }))).toBeNull()
  })

  it('does not stack on the fixed-background option, which is already a parallax', () => {
    const c = draw({ photoMovement: 'strong', backgroundBehavior: 'fixed' })
    expect(moving(c)).toBeNull()
  })

  it('has nothing to move without a photo', () => {
    expect(moving(draw({ imageUrl: '', photoMovement: 'strong' }))).toBeNull()
  })

  it('keeps the dark overlay and the words above the moving photo', () => {
    const c = draw({ photoMovement: 'strong', eyebrow: 'Hello' })
    const layer = moving(c)!
    expect(layer.closest('section')!.querySelector('h1')!.textContent).toBe('Hi')
    expect(layer.contains(c.querySelector('h1'))).toBe(false)
  })

  it('keeps the photo still-sized to the hero: the clipped frame fills the section', () => {
    const frame = moving(draw({ photoMovement: 'gentle' }))!.parentElement as HTMLElement
    expect(frame.style.position).toBe('absolute')
    expect(frame.style.overflow).toBe('hidden')
  })
})
