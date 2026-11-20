// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// On a phone, 100vh is the TALL viewport (the address bar hidden). A "Full screen" hero
// with its headline and button anchored to the bottom therefore sits partly under the
// browser toolbar until the visitor scrolls. 100svh is the viewport as first seen. The
// height is a stored inline value ('100vh'), which cannot carry a fallback, so the
// Full screen option wears a class and a root rule upgrades it where svh is supported.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hero = config.components.Hero as any

const draw = (props: Record<string, unknown>) =>
  render(hero.render({ ...hero.defaultProps, heading: 'Hello', imageUrl: '/a.jpg', ...props, puck: {} }) as ReactElement).container

function rootCss(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root = (config.root as any).render({ children: null }) as ReactElement
  return [...render(root).container.querySelectorAll('style')].map((s) => s.innerHTML).join('\n')
}

describe('Full screen hero on a phone', () => {
  it.each(['bottom', 'centered'])('the %s layout is marked, and keeps 100vh as the fallback', (layout) => {
    const section = draw({ layout, height: '100vh' }).querySelector('section') as HTMLElement

    expect(section).toHaveClass('pk-vh-full')
    expect(section.style.minHeight).toBe('100vh')
  })

  it('the split layout image column is marked too', () => {
    const container = draw({ layout: 'split', height: '100vh' })

    expect(container.querySelector('.pk-vh-full')).not.toBeNull()
  })

  it.each(['80vh', '60vh', '45vh'])('a %s hero is left alone', (height) => {
    expect(draw({ height }).querySelector('.pk-vh-full')).toBeNull()
  })

  it('keeps the hide-on-mobile class it already had', () => {
    const section = draw({ height: '100vh', hideOnMobile: true }).querySelector('section') as HTMLElement

    expect(section).toHaveClass('pk-vh-full')
    expect(section).toHaveClass('pk-hide-mobile')
  })

  it('the page upgrades it to the small viewport height only where the browser knows it', () => {
    const css = rootCss().replace(/\s+/g, '')

    expect(css).toContain('@supports(height:100svh){.pk-vh-full{min-height:100svh!important}}')
  })
})
