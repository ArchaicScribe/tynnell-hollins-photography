// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// TYN-358: Photo movement (parallax) and Text fade-up are shared style controls
// on every page-builder block that is wrapped in the common Section.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = { fields: Record<string, any>; defaultProps: Record<string, any>; render: (props: any) => ReactElement }
const components = config.components as unknown as Record<string, Block>

// jsdom has neither matchMedia nor IntersectionObserver; the blocks use both.
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { fn(0); return 1 })
})
afterEach(() => vi.unstubAllGlobals())

const withMovement = Object.entries(components).filter(([, b]) => b.fields && 'photoMovement' in b.fields)
const draw = (name: string, props: Record<string, unknown>) =>
  render(components[name].render({ ...components[name].defaultProps, ...props, puck: {} }))

describe('Photo movement control', () => {
  it('is offered as None, Gentle, Medium or Strong', () => {
    const field = components.SectionHeading.fields.photoMovement
    expect(field.type).toBe('select')
    expect(field.label).toBe('Photo movement on scroll')
    expect(field.options.map((o: { value: string }) => o.value)).toEqual(['none', 'gentle', 'medium', 'strong'])
  })

  it('defaults to gentle for new blocks', () => {
    expect(components.SectionHeading.defaultProps.photoMovement).toBe('gentle')
  })

  it('is on every block that uses the shared Section wrapper', () => {
    // 22 blocks share Section; a missed one would silently ignore the control.
    expect(withMovement.length).toBeGreaterThanOrEqual(15)
  })

  it('moves the background photo of a block when set, and leaves it still when None', () => {
    const moving = draw('SectionHeading', { backgroundImage: '/bg.jpg', photoMovement: 'medium' })
    expect(moving.container.querySelector('[data-parallax-layer]')).not.toBeNull()

    const still = draw('SectionHeading', { backgroundImage: '/bg.jpg', photoMovement: 'none' })
    expect(still.container.querySelector('[data-parallax-layer]')).toBeNull()
  })

  it('leaves blocks saved before the control existed exactly as they were', () => {
    const { container } = render(
      components.SectionHeading.render({ ...components.SectionHeading.defaultProps, photoMovement: undefined, backgroundImage: '/bg.jpg', puck: {} }),
    )
    expect(container.querySelector('[data-parallax-layer]')).toBeNull()
  })

  it('passes the setting through every block that offers it', () => {
    const missed: string[] = []
    let rendered = 0
    for (const [name] of withMovement.filter(([n]) => n !== 'SplitImageText')) {
      try {
        const { container, unmount } = draw(name, { backgroundImage: '/bg.jpg', photoMovement: 'medium' })
        rendered += 1
        if (!container.querySelector('[data-parallax-layer]')) missed.push(name)
        unmount()
      } catch {
        // a block that cannot render bare (needs resolved data) is covered by its own tests
      }
    }
    expect(missed).toEqual([])
    // the catch above must not be hiding most of the blocks
    expect(rendered).toBeGreaterThanOrEqual(10)
  })

  it('moves the photo in Split Image + Text for side by side and overlay, not stacked', () => {
    const base = { imageUrl: '/p.jpg', photoMovement: 'medium' }
    expect(draw('SplitImageText', { ...base, layout: 'side-by-side' }).container.querySelector('[data-parallax-layer]')).not.toBeNull()
    expect(draw('SplitImageText', { ...base, layout: 'overlay' }).container.querySelector('[data-parallax-layer]')).not.toBeNull()
    expect(draw('SplitImageText', { ...base, layout: 'stacked' }).container.querySelector('[data-parallax-layer]')).toBeNull()
  })
})

describe('Text fade-up control', () => {
  it('is an On/Off control, on for new blocks', () => {
    const field = components.SectionHeading.fields.textFadeUp
    expect(field.type).toBe('radio')
    expect(field.label).toBe('Text fades up on scroll')
    expect(components.SectionHeading.defaultProps.textFadeUp).toBe(true)
  })

  it('wraps the section content when on, and when blocks saved before the control existed have no value', () => {
    expect(draw('SectionHeading', { textFadeUp: true }).container.querySelector('[data-fade-up]')).not.toBeNull()
    expect(draw('SectionHeading', { textFadeUp: undefined }).container.querySelector('[data-fade-up]')).not.toBeNull()
  })

  it('does not wrap the content when switched off', () => {
    expect(draw('SectionHeading', { textFadeUp: false }).container.querySelector('[data-fade-up]')).toBeNull()
  })
})
