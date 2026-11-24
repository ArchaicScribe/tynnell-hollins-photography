// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { config } from './puck.config'

// Hero "Brand + tagline" layout (2026-11-24), the Rising Roots opening: a large, light,
// letter-spaced wordmark, a hairline rule, and the italic tagline beside it, centred over
// the photograph. The wordmark is the page's h1 (it is the name of the business), the
// tagline a paragraph. With no wordmark the hero behaves as a plain centred hero.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components = config.components as Record<string, any>
const hero = components.Hero
const draw = (props: Record<string, unknown>) =>
  render(hero.render({ ...hero.defaultProps, layout: 'brand', imageUrl: '/a.jpg', height: '100vh', ...props, puck: {} }) as ReactElement)

describe('Hero brand layout', () => {
  it('is offered in the layout picker', () => {
    const layoutField = hero.fields.layout.render({ value: 'brand', onChange: () => {} }) as ReactElement
    const options = (layoutField.props as { options: { value: string }[] }).options.map((o) => o.value)

    expect(options).toContain('brand')
  })

  it('shows the wordmark as the h1, in light uppercase with wide tracking', () => {
    const { container } = draw({ wordmark: 'Tynnell Hollins', heading: 'Lost in the Moment' })
    const h1 = container.querySelector('h1')!

    expect(h1.textContent).toBe('Tynnell Hollins')
    expect(h1.style.fontWeight).toBe('300')
    expect(h1.style.textTransform).toBe('uppercase')
    expect(parseFloat(h1.style.letterSpacing)).toBeGreaterThanOrEqual(0.1)
  })

  it('sets the tagline beside it as an italic paragraph, not a second heading', () => {
    const { container } = draw({ wordmark: 'Tynnell Hollins', heading: 'Lost in the Moment' })
    const tagline = [...container.querySelectorAll('p')].find((p) => p.textContent === 'Lost in the Moment')!

    expect(tagline).toBeDefined()
    expect(tagline.style.fontStyle).toBe('italic')
    expect(container.querySelectorAll('h1,h2').length).toBe(1)
  })

  it('puts a hairline rule between the wordmark and the tagline, hidden from screen readers', () => {
    const { container } = draw({ wordmark: 'Tynnell Hollins', heading: 'Lost in the Moment' })
    const rule = container.querySelector('.pk-hero-brand-rule')!

    expect(rule).not.toBeNull()
    expect(rule.getAttribute('aria-hidden')).toBe('true')
  })

  it('uses a logo image as the wordmark when one is given, named by the wordmark text', () => {
    const { container } = draw({ wordmark: 'Tynnell Hollins', wordmarkImageUrl: '/logo.png', heading: 'Tagline' })
    const img = container.querySelector('h1 img')!

    expect(img.getAttribute('src')).toBe('/logo.png')
    expect(img.getAttribute('alt')).toBe('Tynnell Hollins')
  })

  it('without a wordmark the heading is the h1 and there is no rule', () => {
    const { container } = draw({ wordmark: '', heading: 'Lost in the Moment' })

    expect(container.querySelector('h1')!.textContent).toBe('Lost in the Moment')
    expect(container.querySelector('.pk-hero-brand-rule')).toBeNull()
  })

  it('renders nothing for a blank hero rather than an empty h1', () => {
    const { container } = draw({ wordmark: '', heading: '  ' })

    expect(container.querySelector('h1')).toBeNull()
  })

  it('keeps the corner labels, the nav-over-hero mark and the full-screen class', () => {
    const { container } = draw({ wordmark: 'T', heading: 'x', cornerLeft: 'Based in New Mexico', navHero: true })
    const section = container.querySelector('section')!

    expect(container.querySelector('.pk-hero-corners')!.textContent).toContain('Based in New Mexico')
    expect(section.hasAttribute('data-nav-hero')).toBe(true)
    expect(section.className).toContain('pk-vh-full')
  })

  // The reference's wordmark is about 64px at a 1278px window; 5.6vw made ours 71px.
  it('sizes the wordmark to 5vw, capped at 4rem, so it is about 64px on a laptop', () => {
    // jsdom drops clamp(), so read the markup the server would send.
    const html = renderToStaticMarkup(hero.render({ ...hero.defaultProps, layout: 'brand', imageUrl: '/a.jpg', wordmark: 'Tynnell Hollins', heading: 'x', puck: {} }) as ReactElement)

    expect(html).toMatch(/<h1[^>]*font-size:clamp\(2rem,5vw,4rem\)/)
  })

  // The nav shows the same name, so over this hero (and only while the bar is transparent)
  // the nav brand steps aside; the hero carries the marker the stylesheet keys on.
  it('marks itself for the nav only when the wordmark is showing over the page opening', () => {
    const marker = 'data-nav-brand-hero'
    const section = (props: Record<string, unknown>) => draw(props).container.querySelector('section')!

    expect(section({ wordmark: 'T', heading: 'x', navHero: true }).hasAttribute(marker)).toBe(true)
    expect(section({ wordmark: 'T', heading: 'x' }).hasAttribute(marker)).toBe(false)
    expect(section({ wordmark: '', heading: 'x', navHero: true }).hasAttribute(marker)).toBe(false)
    expect(section({ wordmark: 'T', heading: 'x', navHero: true, imageUrl: '' }).hasAttribute(marker)).toBe(false)
    expect(section({ wordmark: 'T', heading: 'x', navHero: true, layout: 'centered' }).hasAttribute(marker)).toBe(false)
  })

  it('stacks the wordmark over the tagline on a phone and turns the rule sideways', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const root = (config.root as any).render({ children: null }) as ReactElement
    const css = render(root).container.querySelector('style')!.innerHTML.replace(/\s+/g, ' ')

    expect(css).toMatch(/@media \(max-width:\s*\d+px\)\s*\{[^@]*\.pk-hero-brand\s*\{[^}]*flex-direction:\s*column/)
    expect(css).toMatch(/\.pk-hero-brand-rule\s*\{[^}]*height:\s*1px/)
  })
})
