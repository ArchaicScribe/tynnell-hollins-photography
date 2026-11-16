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

  it('is title case with no tracking', () => {
    expect(link()).not.toMatch(/text-transform:\s*uppercase/)
    const tracking = link().match(/letter-spacing:\s*([^;]+);/)?.[1].trim()
    expect(tracking === undefined || tracking === 'normal' || tracking === '0').toBe(true)
  })

  it('is 18px at desktop width', () => {
    expect(link()).toMatch(/font-size:\s*(18px|1\.125rem)/)
  })

  it('has no leftover uppercase or tracking override on the links in the mid-width band', () => {
    const band = mediaBlock('(min-width: 1025px) and (max-width: 1240px)')
    const linkRule = band.match(/\.link\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(linkRule).not.toMatch(/text-transform|letter-spacing/)
  })
})

describe('Navbar.module.css menu button', () => {
  it('is visible on desktop: the base rule does not hide it', () => {
    expect(bodyOf('.hamburger')).not.toMatch(/display:\s*none/)
  })

  it('still collapses the link rows below 1024px and keeps the button', () => {
    const narrow = mediaBlock('(max-width: 1024px)')
    expect(narrow).toMatch(/\.row\s*\{[^}]*display:\s*none/)
    expect(narrow).toMatch(/\.hamburger\s*\{[^}]*display:\s*flex/)
  })

  it('labels the open menu in the script role', () => {
    expect(bodyOf('.menuLabel')).toContain('font-family: var(--font-script-role, var(--font-display))')
  })
})

describe('Navbar.module.css hairline', () => {
  it('draws a 1px line along the bottom edge while transparent over a hero', () => {
    const after = bodyOf('.navbar::after') ?? ''
    expect(after).toMatch(/bottom:\s*0/)
    expect(after).toMatch(/height:\s*1px/)
  })

  it('switches the line off once the bar is solid', () => {
    const off = solidRules().find((r) => /::after/.test(r.selector))
    expect(off?.selector).toMatch(/\.scrolled::after/)
    expect(off?.selector).toMatch(/\.menuOpen::after/)
    expect(off?.body).toMatch(/opacity:\s*0/)
  })
})

describe('Navbar.module.css dropdown', () => {
  it('has no dropdown rules left, the row has no Portfolio menu', () => {
    expect(css).not.toMatch(/\.(hasDropdown|arrow|arrowOpen|dropdown|dropdownOpen|dropdownItem)\b/)
  })
})
