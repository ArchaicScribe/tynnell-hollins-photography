import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

// CSS modules do not apply in jsdom, so what the navbar looks like once it is
// solid can only be checked from the stylesheet text. TYN-352: those colors
// come from the navbar's own /design settings and fall back to the button
// colors, which is what the navbar used before it had its own.
const css = readFileSync(path.resolve(__dirname, 'Navbar.module.css'), 'utf8')

const BG_WITH_FALLBACK = 'var(--color-nav-bg, var(--color-btn-bg))'
const TEXT_WITH_FALLBACK = 'var(--color-nav-text, var(--color-btn-text))'

// Every rule whose selector targets the solid state (.scrolled or .menuOpen).
function solidRules(): { selector: string; body: string }[] {
  const rules: { selector: string; body: string }[] = []
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1].replace(/\/\*[\s\S]*?\*\//g, '').trim()
    if (/\.(scrolled|menuOpen)\b/.test(selector)) rules.push({ selector, body: match[2] })
  }
  return rules
}

describe('Navbar.module.css solid state', () => {
  it('finds the solid-state rules it is meant to check', () => {
    expect(solidRules().length).toBeGreaterThan(5)
  })

  it('paints the solid bar with the navbar color, falling back to the button color', () => {
    const bar = solidRules().find((r) => r.selector.replace(/\s+/g, '') === '.scrolled,.menuOpen')

    expect(bar?.body).toContain(`background: ${BG_WITH_FALLBACK}`)
  })

  it('colors the solid bar text with the navbar text color, falling back to the button text color', () => {
    const rules = solidRules().filter((r) => r.body.includes('--color-nav-text'))

    // brand mark, brand sub, CTA, link, link hover, hamburger bar
    expect(rules.length).toBeGreaterThanOrEqual(6)
  })

  it('never reads a button color in the solid state except as the fallback', () => {
    for (const { selector, body } of solidRules()) {
      const withoutFallbacks = body.split(BG_WITH_FALLBACK).join('').split(TEXT_WITH_FALLBACK).join('')
      expect(withoutFallbacks, `${selector} reads a button color directly`).not.toMatch(/--color-btn-(bg|text)/)
    }
  })
})
