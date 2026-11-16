import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

// CSS modules do not apply in jsdom, so how the footer looks is checked from the
// stylesheet text. The footer shares the navbar's colours (TYN-352), so /design
// controls the nav and the footer together and no new design field is needed.
const css = readFileSync(path.resolve(__dirname, 'Footer.module.css'), 'utf8')

const BG = 'var(--color-nav-bg, var(--color-btn-bg))'
const TEXT = 'var(--color-nav-text, var(--color-btn-text))'

const norm = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim()

// Every declaration that applies to `selector`, whether it has a rule of its own
// or shares a grouped one ("a, b { ... }"). Media-block rules are included too.
function bodyOf(selector: string): string {
  let body = ''
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = norm(match[1]).split(',').map((s) => s.trim())
    if (selectors.includes(selector)) body += match[2]
  }
  return body
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

describe('Footer.module.css colours', () => {
  it('paints the footer with the navbar color, falling back to the button color', () => {
    expect(bodyOf('.footer')).toContain(`background: ${BG}`)
  })

  it('sets the text with the navbar text color, falling back to the button text color', () => {
    expect(bodyOf('.footer')).toContain(`color: ${TEXT}`)
  })

  it('never reads a button color except as those two fallbacks', () => {
    const withoutFallbacks = css.split(BG).join('').split(TEXT).join('')
    expect(withoutFallbacks).not.toMatch(/--color-btn-(bg|text)/)
  })

  it('does not use the old dark-palette variables, which would be unreadable on olive', () => {
    expect(css).not.toMatch(/--color-(heading|body|detail|bg|bg-accent|border)\b/)
  })
})

describe('Footer.module.css type', () => {
  // The reference sets labels and the link list as small caps: Barlow 12px,
  // weight 300, 1.8px tracking.
  for (const selector of ['.link', '.label', '.button', '.legalLink', '.copy']) {
    it(`sets ${selector} as small caps through the sans variable`, () => {
      const body = bodyOf(selector)
      expect(body).toContain('font-family: var(--font-sans)')
      expect(body).toMatch(/text-transform:\s*uppercase/)
      expect(body).toMatch(/font-size:\s*(12px|0\.75rem)/)
      expect(body).toMatch(/font-weight:\s*300/)
      expect(body).toMatch(/letter-spacing:\s*1\.8px/)
    })
  }

  it('sets the two script headings in the script role', () => {
    expect(bodyOf('.script')).toContain('font-family: var(--font-script-role, var(--font-display))')
  })

  it('names no font family directly anywhere', () => {
    const families = [...css.matchAll(/font-family:\s*([^;]+);/g)].map((m) => m[1])
    for (const family of families) expect(family).toMatch(/^var\(/)
  })
})

describe('Footer.module.css long text', () => {
  it('wraps a long link rather than letting it push past the screen', () => {
    expect(bodyOf('.link')).toMatch(/overflow-wrap:\s*anywhere/)
  })
})

describe('Footer.module.css photo strip', () => {
  it('runs the photos edge to edge in one row, however many there are', () => {
    const strip = bodyOf('.strip')
    expect(strip).toMatch(/display:\s*grid/)
    expect(strip).toMatch(/grid-auto-flow:\s*column/)
    expect(strip).toMatch(/grid-auto-columns:\s*1fr/)
  })

  it('wraps to three across on a narrow screen', () => {
    const narrow = mediaBlock('(max-width: 768px)')
    expect(narrow).toMatch(/\.strip\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/)
    expect(narrow).toMatch(/\.strip\s*\{[^}]*grid-auto-flow:\s*row/)
  })
})

describe('Footer.module.css removed rules', () => {
  it('has no rules left for the old call-to-action row or the Instagram strip', () => {
    expect(css).not.toMatch(/\.(cta|ctaText|ctaLink|instagram|igInfo|igLabel|igHandle|igPhotos|igPhoto|igPhotoImg)\b/)
  })
})
