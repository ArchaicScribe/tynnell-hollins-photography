// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { readFileSync } from 'fs'
import path from 'path'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// A band section tells the stylesheet which colour it should fade into at its edges: a deep
// band sits inside olive (the olive About band above it, the olive footer below), an olive
// band sits on the page ground. The stylesheet draws the fade (see app/(site)/globals.css).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cta = (config.components as Record<string, any>).CTA
const draw = (background: string) =>
  render(cta.render({ ...cta.defaultProps, heading: 'Ready?', hideUntilFilled: false, background, puck: {} }) as ReactElement).container.querySelector('section')!

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} unobserve() {} })
})
afterEach(() => vi.unstubAllGlobals())

describe('band section edge colour', () => {
  it('fades a deep-olive band into the olive around it', () => {
    expect(draw('var(--color-btn-hover, #2E2A19)').style.getPropertyValue('--band-edge')).toContain('--color-btn-bg')
  })

  it('fades an olive band into the page ground', () => {
    expect(draw('var(--color-btn-bg, #6F6950)').style.getPropertyValue('--band-edge')).toContain('--color-ground')
  })

  it('leaves a plain section without an edge colour', () => {
    expect(draw('transparent').style.getPropertyValue('--band-edge')).toBe('')
  })
})

describe('site stylesheet band edges', () => {
  const css = readFileSync(path.resolve(__dirname, '../(site)/globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const tokens = readFileSync(path.resolve(__dirname, '../(site)/styles/tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  // Every declaration of every rule whose selector list mentions the needle (the two layers
  // share one rule for their common parts and have one each for the gradient).
  const rule = (needle: string) =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => m[1].replace(/\s+/g, ' ').includes(needle)).map((m) => m[2]).join(' ')

  it('draws a fade at the top and the bottom of every band section, as long as the theme says', () => {
    const top = rule('--band-cream"]::before')
    const bottom = rule('--band-cream"]::after')

    expect(top).toMatch(/height:\s*var\(--band-edge-size/)
    expect(top).toMatch(/linear-gradient\(to bottom,\s*var\(--band-edge\)/)
    expect(bottom).toMatch(/linear-gradient\(to top,\s*var\(--band-edge\)/)
  })

  it('never blocks a click on the section underneath', () => {
    expect(rule('--band-cream"]::before')).toMatch(/pointer-events:\s*none/)
  })

  it('has the page ground available to the olive band, whatever colour a band overrides --color-bg to', () => {
    expect(tokens).toMatch(/--color-ground:\s*var\(--color-bg\)/)
  })
})
