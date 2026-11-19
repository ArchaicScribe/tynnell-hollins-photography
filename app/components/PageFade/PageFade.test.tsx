// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'fs'
import path from 'path'
import type { ComponentType, ReactNode } from 'react'

// Step 5, item 9: moving between pages fades the new page in while the nav and
// footer (which live in the layout) stay still. Keyed on the full pathname, so
// /blog to /blog/a-post fades too (a template.tsx only remounts when the first
// path segment changes). The first page load never fades: only a navigation that
// happens after the page has hydrated does.

let pathname = '/'
vi.mock('next/navigation', () => ({ usePathname: () => pathname }))

let PageFade: ComponentType<{ children: ReactNode }>

beforeEach(async () => {
  pathname = '/'
  vi.resetModules() // the "has the first page loaded" flag lives in module scope
  PageFade = (await import('./PageFade')).PageFade
})

const wrapper = () => screen.getByText('Page content').parentElement as HTMLElement

describe('PageFade', () => {
  it('does not fade the first page load, so nothing is hidden before it paints', () => {
    render(<PageFade><p>Page content</p></PageFade>)

    expect(wrapper().className).not.toContain('pageFadeIn')
  })

  it('fades the new page in when the route changes', () => {
    const { rerender } = render(<PageFade><p>Page content</p></PageFade>)

    pathname = '/about'
    rerender(<PageFade><p>Page content</p></PageFade>)

    expect(wrapper().className).toContain('pageFadeIn')
  })

  it('fades when only the deeper path changes, such as /blog to /blog/a-post', () => {
    pathname = '/blog'
    const { rerender } = render(<PageFade><p>Page content</p></PageFade>)

    pathname = '/blog/a-post'
    rerender(<PageFade><p>Page content</p></PageFade>)

    expect(wrapper().className).toContain('pageFadeIn')
  })

  it('replaces the page element on every route change, so the fade can play again', () => {
    const { rerender } = render(<PageFade><p>Page content</p></PageFade>)
    const first = wrapper()

    pathname = '/about'
    rerender(<PageFade><p>Page content</p></PageFade>)
    const second = wrapper()
    pathname = '/contact'
    rerender(<PageFade><p>Page content</p></PageFade>)

    expect(second).not.toBe(first)
    expect(wrapper()).not.toBe(second)
    expect(wrapper().className).toContain('pageFadeIn')
  })

  it('leaves the page alone when the route has not changed', () => {
    const { rerender } = render(<PageFade><p>Page content</p></PageFade>)
    const first = wrapper()

    rerender(<PageFade><p>Page content</p></PageFade>)

    expect(wrapper()).toBe(first)
    expect(wrapper().className).not.toContain('pageFadeIn')
  })
})

describe('the page fade styles', () => {
  const css = readFileSync(path.resolve(__dirname, '../../(site)/globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

  it('fade from clear to solid with no movement, so a fixed overlay inside the page is not boxed in', () => {
    const keyframes = css.match(/@keyframes pageFadeIn\s*\{([\s\S]*?\})\s*\}/)?.[1] ?? ''

    expect(keyframes).toMatch(/from\s*\{\s*opacity:\s*0/)
    expect(keyframes).toMatch(/to\s*\{\s*opacity:\s*1/)
    expect(keyframes).not.toContain('transform')
  })

  it('run on the base motion token and ease, and do not hold a stacking context afterwards', () => {
    const rule = css.match(/\.pageFadeIn\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(rule).toContain('pageFadeIn var(--motion-base)')
    expect(rule).toContain('var(--ease)')
    expect(rule).toMatch(/\bbackwards\b/) // not "both" / "forwards": the finished page has no animation effect left
  })
})
