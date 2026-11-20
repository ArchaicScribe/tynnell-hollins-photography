// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { readFileSync } from 'fs'
import path from 'path'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// A tape strip is a positioned ::before / ::after on the photo's mat. The photo inside is
// a plain static <img>, so it only paints over a strip that comes before it in the markup
// (the ::before one) when the photo is a stacking context, which it was while it carried
// the CSS colour filter. Photos with the colour baked in (since 2026-11-20) carry no
// filter, so the left strip flipped from under the photo to on top of it, while a photo
// that still has the filter (a legacy file) kept it underneath. An explicit z-index makes
// both strips lie on the photo whatever the photo's own styling, as the teaser cards and
// the About headshot already did.

const TAPE_RULE = /([^{}]*::(?:before|after)[^{}]*)\{([^{}]*var\(--tape-color[^{}]*)\}/g

function tapeRules(css: string) {
  return [...css.matchAll(TAPE_RULE)].map((m) => ({ selector: m[1].trim(), body: m[2] }))
}

function rootCss(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root = (config.root as any).render({ children: null }) as ReactElement
  return [...render(root).container.querySelectorAll('style')].map((s) => s.innerHTML).join('\n')
}

const read = (rel: string) => readFileSync(path.resolve(__dirname, rel), 'utf8')

describe('tape strips lie on top of the photo', () => {
  it.each([
    ['the builder Photo Gallery taped style', () => rootCss()],
    ['the gallery page taped style', () => read('../(site)/portfolio/[slug]/page.module.css')],
    ['the home teaser cards', () => read('../components/PortfolioTeaser/PortfolioTeaser.module.css')],
    ['the About headshot', () => read('../(site)/about/page.module.css')],
  ])('%s', (_label, css) => {
    const rules = tapeRules(css())

    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) expect(rule.body, rule.selector).toMatch(/z-index:\s*3/)
  })
})
