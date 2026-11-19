// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from '@/app/builder/puck.config'
import Hero from '@/app/components/Hero/Hero'

// The nav is solid from the first paint unless the page opens on a full-bleed
// photo, which is announced by [data-nav-hero] (see Navbar.module.css). Every
// first-section hero must carry the marker, or the nav stays solid over it.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = { defaultProps: Record<string, any>; render: (props: any) => ReactElement }
const components = config.components as unknown as Record<string, Block>
const draw = (name: string, props: Record<string, unknown>) =>
  render(components[name].render({ ...components[name].defaultProps, ...props, puck: {} }))

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} unobserve() {} })
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { fn(0); return 1 })
})
afterEach(() => vi.unstubAllGlobals())

const marker = '[data-nav-hero]'

describe('data-nav-hero marker', () => {
  it('is on the home hero when it has a photo', () => {
    const { container } = render(<Hero slides={[{ id: '1', imageUrl: '/a.jpg' }]} />)
    expect(container.querySelector(marker)).not.toBeNull()
  })

  it('is not on the home hero when no slide has a photo, so the nav stays readable', () => {
    const { container } = render(<Hero slides={[{ id: '1', imageUrl: null }]} />)
    expect(container.querySelector(marker)).toBeNull()
  })

  // A builder block only says it opens the page when the page tells it so
  // (navHero, set by markNavHero on the FIRST block only).
  it('is on the page-builder Hero (full-bleed layouts) when it is flagged as first and has a photo', () => {
    expect(draw('Hero', { layout: 'bottom', imageUrl: '/a.jpg', navHero: true }).container.querySelector(marker)).not.toBeNull()
    expect(draw('Hero', { layout: 'centered', imageUrl: '/a.jpg', navHero: true }).container.querySelector(marker)).not.toBeNull()
  })

  it('is not on a page-builder Hero that is not flagged, has no photo, or is split', () => {
    expect(draw('Hero', { layout: 'bottom', imageUrl: '/a.jpg' }).container.querySelector(marker)).toBeNull()
    expect(draw('Hero', { layout: 'bottom', imageUrl: '', navHero: true }).container.querySelector(marker)).toBeNull()
    expect(draw('Hero', { layout: 'split', imageUrl: '/a.jpg', navHero: true }).container.querySelector(marker)).toBeNull()
  })

  it('is on the page-builder Full Width Image only when flagged as first and it has a photo', () => {
    expect(draw('FullWidthImage', { imageUrl: '/a.jpg', navHero: true }).container.querySelector(marker)).not.toBeNull()
    expect(draw('FullWidthImage', { imageUrl: '/a.jpg' }).container.querySelector(marker)).toBeNull()
    expect(draw('FullWidthImage', { imageUrl: '', navHero: true }).container.querySelector(marker)).toBeNull()
  })
})
