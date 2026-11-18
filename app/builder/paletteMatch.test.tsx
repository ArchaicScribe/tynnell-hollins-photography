// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'fs'
import path from 'path'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// Palette match with Rising Roots (2026-11-18). The theme values already match
// (bone #E4E2D8, olive #6F6950, deep olive #2E2A19, cream #ECE9E0); what differed
// was how they were used: the hero text was pure white over a neutral black
// scrim, the transparent nav was pure white, and there was no way to make the
// olive and deep-olive bands the reference alternates down the page.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components = config.components as Record<string, any>
const draw = (name: string, props: Record<string, unknown>) =>
  render(components[name].render({ ...components[name].defaultProps, ...props, puck: {} }) as ReactElement)

const CREAM = 'rgb(236, 233, 224)'
// The overlay variable's own fallback legitimately holds that colour; ignore it.
const withoutFallback = (html: string) =>
  html.replace(/var\(--color-bg-overlay,\s*rgba\(12,\s*12,\s*12,\s*0\.76\)\)/g, '')
const NEUTRAL_BLACK_SCRIM = /rgba\(12,\s*12,\s*12/

describe('text over a photograph is the reference cream, not white', () => {
  it.each(['bottom', 'centered'])('hero heading, %s layout', (layout) => {
    const { container } = draw('Hero', { heading: 'Lost in the Moment', imageUrl: '/a.jpg', layout })

    expect(container.querySelector('h1')!.style.color).toBe(CREAM)
  })
})

describe('scrims over photographs use the palette overlay colour, not neutral black', () => {
  it.each(['bottom', 'centered'])('hero, %s layout', (layout) => {
    const { container } = draw('Hero', { heading: 'x', imageUrl: '/a.jpg', layout })

    expect(container.innerHTML).toContain('--color-bg-overlay')
    expect(withoutFallback(container.innerHTML)).not.toMatch(NEUTRAL_BLACK_SCRIM)
  })

  it('a section background photo', () => {
    const { container } = draw('CTA', { heading: 'x', backgroundImage: '/bg.jpg' })

    expect(container.innerHTML).toContain('--color-bg-overlay')
    expect(withoutFallback(container.innerHTML)).not.toMatch(NEUTRAL_BLACK_SCRIM)
  })

  it('a Split Image + Text overlay', () => {
    const { container } = draw('SplitImageText', { heading: 'x', imageUrl: '/a.jpg', layout: 'overlay' })

    expect(container.innerHTML).toContain('--color-bg-overlay')
    expect(withoutFallback(container.innerHTML)).not.toMatch(NEUTRAL_BLACK_SCRIM)
  })
})

describe('olive and deep olive bands', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options = (components.CTA.fields.background.options as any[])

  it('are offered as section backgrounds', () => {
    expect(options.map((o) => o.label)).toEqual(expect.arrayContaining(['Olive band', 'Deep olive band']))
  })

  const band = (label: string) => options.find((o) => o.label === label).value as string

  it.each([
    ['Olive band', 'var(--color-btn-bg'],
    ['Deep olive band', 'var(--color-btn-hover'],
  ])('%s fills the section from the theme colour', (label, token) => {
    const { container } = draw('CTA', { heading: 'x', background: band(label) })

    expect((container.querySelector('section') as HTMLElement).style.background).toContain(token)
  })

  it.each(['Olive band', 'Deep olive band'])('%s turns the words and the button light inside it', (label) => {
    const { container } = draw('CTA', { heading: 'Get in touch', background: band(label) })
    const wrap = container.querySelector('h2')!.parentElement!.closest('[style*="--color-heading"]') as HTMLElement

    expect(wrap).not.toBeNull()
    expect(wrap.style.getPropertyValue('--color-heading')).toContain('--band-cream')
    expect(wrap.style.getPropertyValue('--color-body')).toContain('--band-cream')
    // the button turns cream; its label is the band colour, set on the section
    // itself so it resolves before the button variables are overridden
    expect(wrap.style.getPropertyValue('--color-btn-bg')).toContain('--band-cream')
    expect((container.querySelector('section') as HTMLElement).style.getPropertyValue('--color-bg')).toBe(band(label))
  })

  it('leave ordinary sections exactly as they were', () => {
    const { container } = draw('CTA', { heading: 'x', background: 'transparent' })

    expect(container.innerHTML).not.toContain('--color-heading:')
  })

  it('also work on Split Image + Text, the About story band', () => {
    const { container } = draw('SplitImageText', { heading: 'Hi', body: 'Words', imageUrl: '/a.jpg', layout: 'split', background: band('Olive band') })
    const wrap = container.querySelector('h2')!.parentElement!.closest('[style*="--color-heading"]')

    expect(wrap).not.toBeNull()
  })
})

describe('inside a band (review findings)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options = components.CTA.fields.background.options as any[]
  const wrapFor = (name: string, props: Record<string, unknown>) => {
    const { container } = draw(name, props)
    return container.querySelector('h2')!.parentElement!.closest('[style*="--color-heading"]') as HTMLElement
  }
  const olive = options.find((o) => o.label === 'Olive band').value as string

  it('pins the cream on the section so the wrapper can safely re-point the button label', () => {
    const { container } = draw('CTA', { heading: 'x', background: olive })

    expect((container.querySelector('section') as HTMLElement).style.getPropertyValue('--band-cream')).toContain('--color-btn-text')
  })

  it('keeps a visible label on every embedded button: cream button, band-coloured label', () => {
    const wrap = wrapFor('CTA', { heading: 'x', background: olive })

    // Forms, Live Services and Email Signup label their button with --color-btn-text.
    expect(wrap.style.getPropertyValue('--color-btn-bg')).toContain('--band-cream')
    expect(wrap.style.getPropertyValue('--color-btn-text')).toContain('--color-bg')
    expect(wrap.style.getPropertyValue('--color-btn-bg')).not.toBe(wrap.style.getPropertyValue('--color-btn-text'))
  })

  it('darkens card and field surfaces so cream words stay readable on them', () => {
    const wrap = wrapFor('CTA', { heading: 'x', background: olive })

    expect(wrap.style.getPropertyValue('--color-bg-accent')).toMatch(/color-mix\(in srgb, var\(--color-bg\) \d+%, black\)/)
  })

  it('is detected by theme colour, so a changed fallback hex on a saved page still counts', () => {
    const savedWithOldFallback = 'var(--color-btn-bg, #123456)'
    const wrap = wrapFor('CTA', { heading: 'x', background: savedWithOldFallback })

    expect(wrap).not.toBeNull()
  })

  it('pins the stored option values, so changing them is a deliberate act', () => {
    expect(options.find((o) => o.label === 'Olive band').value).toBe('var(--color-btn-bg, #6F6950)')
    expect(options.find((o) => o.label === 'Deep olive band').value).toBe('var(--color-btn-hover, #2E2A19)')
  })

  it.each([
    ['stacked layout', { layout: 'stacked', imageUrl: '/a.jpg' }],
    ['hide-until-filled with no photo', { layout: 'split', imageUrl: '', hideUntilFilled: true }],
  ])('Split Image + Text, %s', (_label, extra) => {
    const wrap = wrapFor('SplitImageText', { heading: 'Hi', body: 'Words', background: olive, ...extra })

    expect(wrap).not.toBeNull()
  })
})

describe('scrims survive an old browser and a strong overlay colour', () => {
  // Server-rendered markup is what an old browser parses: the plain colour first,
  // then the color-mix declaration it will drop as invalid. (jsdom accepts both and
  // keeps only the later one, so these read the server output.)
  const markup = (name: string, props: Record<string, unknown>) =>
    renderToStaticMarkup(components[name].render({ ...components[name].defaultProps, ...props, puck: {} }) as ReactElement)

  it('a flat section scrim carries a plain rgba fallback before the color-mix', () => {
    const html = markup('CTA', { heading: 'x', backgroundImage: '/bg.jpg' })

    expect(html).toMatch(/background:rgba\(46,42,25,[^;]*;background-image:linear-gradient\(color-mix/)
  })

  it('a hero gradient scrim carries a plain rgba fallback before the color-mix', () => {
    const html = markup('Hero', { heading: 'x', imageUrl: '/a.jpg', layout: 'bottom' })

    expect(html).toMatch(/background:linear-gradient\(to top,\s*rgba\(46,42,25,[^;]*;background-image:linear-gradient\(to top,\s*color-mix/)
  })

  it('never asks color-mix for more than 100 percent', () => {
    const { container } = draw('CTA', { heading: 'x', backgroundImage: '/bg.jpg', backgroundFade: '1.2' })
    const pcts = [...container.innerHTML.matchAll(/(\d+)%, transparent/g)].map((m) => Number(m[1]))

    expect(pcts.length).toBeGreaterThan(0)
    expect(Math.max(...pcts)).toBeLessThanOrEqual(100)
  })
})

describe('the transparent nav over the hero', () => {
  const css = readFileSync(path.resolve(__dirname, '../components/Navbar/Navbar.module.css'), 'utf8')
  const heroState = css.slice(0, css.indexOf('.scrolled'))

  it('uses cream, not pure white', () => {
    expect(heroState).toContain('--nav-mark')
    expect(heroState).not.toMatch(/255,\s*255,\s*255|#fff\b/i)
  })
})
