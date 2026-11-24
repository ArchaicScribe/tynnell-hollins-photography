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

// The Brand + tagline hero shows the business name large, so the nav brand steps aside
// while the bar is transparent over it (data-nav-brand-hero), and comes back the moment
// the bar turns solid (scrolled or menu open).
describe('Navbar.module.css brand hero', () => {
  const rule = () =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .map((m) => ({ selector: m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim(), body: m[2] }))
      .find((r) => r.selector.includes('data-nav-brand-hero'))

  it('hides the nav brand only while the bar is transparent over a brand hero', () => {
    expect(rule()).toBeDefined()
    expect(rule()!.selector).toContain('.brand')
    expect(rule()!.selector).toContain(':not(.scrolled)')
    expect(rule()!.selector).toContain(':not(.menuOpen)')
    expect(rule()!.body).toMatch(/visibility:\s*hidden/)
  })
})

describe('Navbar.module.css solid state', () => {
  it('finds the solid-state rule it is meant to check', () => {
    expect(solidRules().length).toBeGreaterThanOrEqual(1)
  })

  // The solid state is written once, as custom properties on .navbar, and every
  // element rule reads them. That is what lets scrolling, the open menu and a
  // page with no hero all share it (see the no-hero tests below).
  const solid = () => solidRules().find((r) => /\.scrolled/.test(r.selector) && /\.menuOpen/.test(r.selector))

  it('paints the solid bar with the navbar color, falling back to the button color', () => {
    expect(solid()?.body).toContain(`--nav-bg: ${BG_WITH_FALLBACK}`)
  })

  it('colors the solid bar text with the navbar text color, falling back to the button text color', () => {
    // brand mark, brand sub, CTA, link, link hover, hamburger bar
    expect(solid()?.body.match(/--color-nav-text/g)?.length ?? 0).toBeGreaterThanOrEqual(6)
  })

  it('reads the state variables in the element rules, not literal colors', () => {
    expect(bodyOf('.navbar')).toContain('background: var(--nav-bg)')
    expect(bodyOf('.brandMark')).toContain('color: var(--nav-mark)')
    expect(bodyOf('.brandSub')).toContain('color: var(--nav-sub)')
    expect(bodyOf('.cta')).toContain('color: var(--nav-cta)')
    expect(bodyOf('.link')).toContain('color: var(--nav-link)')
    expect(bodyOf('.link:hover')).toContain('color: var(--nav-link-hover)')
    expect(bodyOf('.bar')).toContain('background: var(--nav-bar)')
  })

  it('never reads a button color in the solid state except as the fallback', () => {
    for (const { selector, body } of solidRules()) {
      const withoutFallbacks = body.split(BG_WITH_FALLBACK).join('').split(TEXT_WITH_FALLBACK).join('')
      expect(withoutFallbacks, `${selector} reads a button color directly`).not.toMatch(/--color-btn-(bg|text)/)
    }
  })
})

// ── Rising Roots row, menu button and hairline ────────────────────────────────

const norm = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim()

// The body of the first rule whose selector is exactly `selector`, anywhere in
// the sheet (base rules and rules inside media blocks alike).
function bodyOf(selector: string): string | undefined {
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (norm(match[1]) === selector) return match[2]
  }
  return undefined
}

// The text inside `@media <query> { ... }`, found by brace counting.
function mediaBlock(query: string): string {
  const start = css.indexOf(`@media ${query}`)
  if (start === -1) return ''
  const open = css.indexOf('{', start)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i)
  }
  return ''
}

describe('Navbar.module.css row links', () => {
  const link = () => bodyOf('.link') ?? ''

  it('sets the links in the serif role through the variable, never a family name', () => {
    expect(link()).toContain('font-family: var(--font-serif)')
  })

})

// A page that does not open on a full-bleed photo must not get white text on the
// bone ground, so the nav is solid from the first paint unless a hero marks the
// page with [data-nav-hero]. Pure CSS: no JS state, so no flash.
describe('Navbar.module.css pages without a hero', () => {
  const sharedSolid = () => solidRules().find((r) => /\.scrolled/.test(r.selector) && /\.menuOpen/.test(r.selector))
  const noHero = () => solidRules().find((r) => /:global\(body\):not\(:has\(\[data-nav-hero\]\)\)/.test(r.selector))

  it('shares the solid state with scrolling and the open menu, so there is one source of truth', () => {
    expect(noHero()).toBeDefined()
    expect(noHero()).toEqual(sharedSolid())
  })

  it('targets the navbar, so the rule is a valid CSS module selector', () => {
    expect(noHero()?.selector).toMatch(/\.navbar/)
  })
})

// Opening the menu adds a "close menu" label to the right-hand group. With plain
// 1fr side columns a wider group grows its column and drags the centred logo left
// (about 27px at 1278px wide), so the side columns must not size to their content
// and the label must take the CTA's place rather than sit beside it.
describe('Navbar.module.css logo stays put when the menu opens', () => {
  it('keeps both side columns equal whatever their content, so the brand is always centred', () => {
    const columns = bodyOf('.navbar')?.match(/grid-template-columns:\s*([^;]+);/)?.[1].replace(/\s+/g, ' ').trim()
    expect(columns).toBe('minmax(0, 1fr) auto minmax(0, 1fr)')
  })

  it('swaps the Inquire link for the close label while the menu is open', () => {
    expect(bodyOf('.menuOpen .cta')).toMatch(/display:\s*none/)
  })
})

describe('Navbar.module.css phones', () => {
  it('hides the "close menu" label on narrow screens so it cannot push the close button off the edge', () => {
    expect(mediaBlock('(max-width: 560px)')).toMatch(/\.menuLabel\s*\{[^}]*display:\s*none/)
  })
})
