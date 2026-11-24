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

// The nav keeps its centre mark over every hero, the Brand + tagline one included: the
// reference has a mark in the middle of the bar there too (2026-11-24; the hide rule from
// PR #200 was taken out again).
describe('Navbar.module.css centre mark', () => {
  it('never hides the brand over a hero (only the open menu does)', () => {
    expect(css).not.toMatch(/data-nav-brand-hero/)
    const hiding = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => /visibility:\s*hidden/.test(m[2])).map((m) => m[1].replace(/\s+/g, ' ').trim())
    for (const selector of hiding) expect(selector).toMatch(/\.menuOpen/)
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

// Matching the Rising Roots bar (measured 2026-11-24 on risingroots.showit.site): the links
// of each half spread evenly across it, the hairline runs edge to edge, the menu button is
// two short thin lines, and "Inquire now" is 25px.
describe('Navbar.module.css matches the Rising Roots bar', () => {
  it('spreads the left links evenly across their half', () => {
    expect(bodyOf('.rowLeft')).toMatch(/justify-content:\s*space-between/)
  })

  it('spreads the right links evenly across what is left of their half, beside the CTA and button', () => {
    const body = bodyOf('.rowRight > .row') ?? ''
    expect(body).toMatch(/flex:\s*1/)
    expect(body).toMatch(/justify-content:\s*space-between/)
  })

  it('runs the hairline from edge to edge, not inset by the page padding', () => {
    const body = bodyOf('.navbar::after') ?? ''
    expect(body).toMatch(/left:\s*0\b/)
    expect(body).toMatch(/right:\s*0\b/)
  })

  it('draws the menu button as two thin lines that cross into an X when open', () => {
    expect(bodyOf('.bar')).toMatch(/height:\s*1px/)
    expect(css).not.toMatch(/\.bar:nth-child\(3\)/)
    expect(bodyOf('.hamburgerOpen .bar:nth-child(1)')).toMatch(/rotate\(45deg\)/)
    expect(bodyOf('.hamburgerOpen .bar:nth-child(2)')).toMatch(/rotate\(-45deg\)/)
    expect(bodyOf('.hamburgerOpen .bar:nth-child(2)')).not.toMatch(/opacity:\s*0/)
  })

  it('sets "Inquire now" at 25px like the reference', () => {
    expect(bodyOf('.cta')).toMatch(/font-size:\s*1\.5625rem/)
  })
})

// The reference crossfades between its transparent and solid bars over about a second
// (measured 2026-11-24, opacity 1 to 0 in ~1s each way), so the colours, the hairline and the
// padding of the bar all ride one slow fade rather than the quick UI one.
describe('Navbar.module.css fades slowly between transparent and solid', () => {
  it('defines one fade time of about a second on the bar', () => {
    expect(bodyOf('.navbar')).toMatch(/--nav-fade:\s*1s/)
  })

  it('uses it for the bar background and padding, the hairline and every nav colour', () => {
    expect(bodyOf('.navbar')).toMatch(/transition:[^;]*background var\(--nav-fade\)[^;]*padding var\(--nav-fade\)/)
    expect(bodyOf('.navbar::after')).toMatch(/transition:\s*opacity var\(--nav-fade\)/)
    expect(bodyOf('.brandMark')).toMatch(/transition:\s*color var\(--nav-fade\)/)
    expect(bodyOf('.brandSub')).toMatch(/transition:\s*color var\(--nav-fade\)/)
    expect(bodyOf('.link')).toMatch(/transition:\s*color var\(--nav-fade\)/)
    expect(bodyOf('.bar')).toMatch(/background var\(--nav-fade\)/)
  })
})

// While the full-screen menu is open the bar is see-through (the photo columns run to the top
// of the screen) and shows only "close menu" and the X, as the reference does.
describe('Navbar.module.css while the menu is open', () => {
  const rule = (needle: string) =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .map((m) => ({ selector: norm(m[1]), body: m[2] }))
      .find((r) => r.selector.includes(needle))

  // Only where the photo columns sit beside the panel (wide screens). On a phone the cards
  // stack under the panel and scroll beneath the bar, so a see-through bar would let the cream
  // X drift over bone and photos; there it stays solid olive.
  it('makes the bar transparent on wide screens only, so the close X always has olive behind it', () => {
    const wide = mediaBlock('(min-width: 1025px) {')
    expect(wide).toMatch(/\.navbar\.menuOpen\s*\{[^}]*--nav-bg:\s*transparent/)
    expect(css.replace(wide, '')).not.toMatch(/\.navbar\.menuOpen\s*\{/)
  })

  // The no-opening-photo rule is `body:not(:has([data-nav-hero])) .navbar`, specificity (0,2,1).
  // A plain `.navbar.menuOpen` is (0,2,0) and loses to it, which left an olive strip over the
  // photo columns on every page without an opening photo (contact, services, ...).
  it('outranks the no-opening-photo rule, so the bar is see-through on those pages too', () => {
    expect(mediaBlock('(min-width: 1025px) {')).toMatch(/:global\(body\)\s+\.navbar\.menuOpen\s*\{/)
  })

  it('hides the link rows and the brand, leaving the close label and the X', () => {
    expect(rule('.menuOpen .row')?.body).toMatch(/visibility:\s*hidden/)
    expect(rule('.menuOpen .brand')?.body).toMatch(/visibility:\s*hidden/)
  })
})
