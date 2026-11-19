// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// Step 5, item 3: builder buttons get a hover. btnStyle() is inline, and inline
// styles cannot carry :hover, so every builder button also wears a class and the
// page injects the rule once, the same way the responsive classes work.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components = config.components as Record<string, any>

function rootCss(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root = (config.root as any).render({ children: null }) as ReactElement
  const { container } = render(root)
  return container.querySelector('style')?.innerHTML ?? ''
}

function buttonsIn(name: string, extra: Record<string, unknown> = {}): HTMLElement[] {
  const block = components[name]
  const props = { ...block.defaultProps, buttonText: 'Go', buttonHref: '/go', ...extra, puck: {} }
  const { unmount, container } = render(block.render(props) as ReactElement)
  const links = [...container.querySelectorAll<HTMLElement>('a')].filter((a) => a.textContent === 'Go')
  unmount()
  return links
}

describe('builder button hover', () => {
  it.each(['Hero', 'CTA', 'SplitImageText'])('the %s button wears the hover class', (name) => {
    const links = buttonsIn(name)

    expect(links.length).toBeGreaterThan(0)
    for (const a of links) expect(a).toHaveClass('pk-btn')
  })

  it('the Packages card button wears the hover class', () => {
    const card = { name: 'Full day', price: '$1', description: 'd', features: 'x', buttonText: 'Go', buttonHref: '/go' }
    const block = components.Packages
    render(block.render({ ...block.defaultProps, cards: [card], puck: {} }) as ReactElement)

    expect(screen.getByRole('link', { name: 'Go' })).toHaveClass('pk-btn')
  })

  it('every button-coloured element any block renders carries the hover class, so a new block cannot forget it', () => {
    const missing: string[] = []
    let buttons = 0
    for (const [name, block] of Object.entries(components)) {
      const cards = [{ name: 'n', price: 'p', description: 'd', features: 'f', buttonText: 'Go', buttonHref: '/go' }]
      const props = { ...block.defaultProps, buttonText: 'Go', buttonHref: '/go', text: 'Go', href: '/go', cards, puck: {} }
      try {
        for (const layout of [undefined, 'bottom', 'centered', 'split', 'stacked']) {
          const { container, unmount } = render(block.render({ ...props, ...(layout ? { layout } : {}) }) as ReactElement)
          for (const el of container.querySelectorAll<HTMLElement>('[style*="--color-btn-bg"]')) {
            buttons++
            if (!el.classList.contains('pk-btn')) missing.push(name)
          }
          unmount()
        }
      } catch {
        // a block that needs props this generic render does not supply is covered by its own tests
      }
    }

    expect(buttons).toBeGreaterThan(5)
    expect(missing).toEqual([])
  })

  it('keeps the inline colours, so the button looks right before any stylesheet loads', () => {
    const [a] = buttonsIn('CTA')

    expect(a.style.background).toContain('--color-btn-bg')
  })

  it('the page rule changes colour to the theme hover colour, beating the inline background', () => {
    expect(rootCss()).toMatch(/\.pk-btn:hover[^{]*\{[^}]*background:\s*var\(--color-btn-hover[^)]*\)\s*!important/)
  })

  it('also reacts to keyboard focus, not only the mouse', () => {
    expect(rootCss()).toMatch(/\.pk-btn:focus-visible/)
  })

  it('lifts a little and eases, but only where hover exists, motion is allowed and animations are on', () => {
    const css = rootCss().replace(/:\s+/g, ':') // ignore spacing after colons
    const motion = css.match(/@media[^{]*hover:hover[^{]*\{[\s\S]*?translateY\(-2px\)[\s\S]*?\}\s*\}/)?.[0] ?? ''

    expect(motion).toContain('prefers-reduced-motion:no-preference')
    expect(motion).toContain('html:not([data-animations="off"])')
    expect(motion).toMatch(/transition:[^;}]*var\(--motion-fast/)
  })
})
