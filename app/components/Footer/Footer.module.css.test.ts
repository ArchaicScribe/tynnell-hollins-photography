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
  // Sizes, tracking and case are tuned by eye against the reference and change
  // often, so they are not pinned here. Only the PR #155 trap is: a font family
  // named directly instead of through a variable.
  it('names no font family directly anywhere', () => {
    const families = [...css.matchAll(/font-family:\s*([^;]+);/g)].map((m) => m[1])
    for (const family of families) expect(family).toMatch(/^var\(/)
  })
})

describe('Footer.module.css logo', () => {
  it('never lets a wide uploaded logo push the page wider than the screen', () => {
    expect(bodyOf('.brandLogo')).toMatch(/max-width:\s*100%/)
  })
})

describe('Footer.module.css long text', () => {
  it('wraps a long link rather than letting it push past the screen', () => {
    expect(bodyOf('.link')).toMatch(/overflow-wrap:\s*anywhere/)
  })
})

describe('Footer.module.css tap targets', () => {
  // The links are 12px text (about 19px tall) and the social icons 18px, too small to hit
  // reliably with a thumb. On a touch screen every footer link gets a 44px target; with a
  // mouse the footer keeps its tight spacing, so the desktop look does not change.
  const touch = mediaBlock('(pointer: coarse)')
  const inTouch = (selector: string) => {
    let body = ''
    for (const match of touch.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (norm(match[1]).split(',').map((s) => s.trim()).includes(selector)) body += match[2]
    }
    return body
  }

  it.each(['.link', '.legalLink'])('%s is at least 44px tall on a touch screen', (selector) => {
    expect(inTouch(selector)).toMatch(/min-height:\s*44px/)
    expect(inTouch(selector)).toMatch(/display:\s*inline-flex/)
    expect(inTouch(selector)).toMatch(/align-items:\s*center/)
  })

  it('social icons are at least 44px square on a touch screen', () => {
    expect(inTouch('.socialLink')).toMatch(/min-height:\s*44px/)
    expect(inTouch('.socialLink')).toMatch(/min-width:\s*44px/)
    expect(inTouch('.socialLink')).toMatch(/justify-content:\s*center/)
  })

  it('drops the gaps the bigger targets replace, so the footer does not grow twice', () => {
    expect(inTouch('.linkList')).toMatch(/gap:\s*0/)
    expect(inTouch('.socials')).toMatch(/gap:\s*0/)
  })

  it('leaves the mouse layout alone: no minimum height outside the touch block', () => {
    expect(css.replace(touch, '')).not.toMatch(/min-height:\s*44px/)
  })
})

describe('Footer.module.css photo strip', () => {
  // Every photo is one sixth of the width, so one or two featured photos stay a
  // normal size instead of stretching to fill the row (a 1440px square for one).
  it('sizes each photo to a sixth of the row and centres a short row', () => {
    const strip = bodyOf('.strip')
    expect(strip).toMatch(/display:\s*flex/)
    expect(strip).toMatch(/flex-wrap:\s*wrap/)
    expect(strip).toMatch(/justify-content:\s*center/)
    expect(bodyOf('.stripPhoto')).toMatch(/flex:\s*0 0 calc\(100% \/ 6\)/)
  })

  it('is three across on a narrow screen, and the last short row is centred, not left with gaps', () => {
    const narrow = mediaBlock('(max-width: 768px)')
    expect(narrow).toMatch(/\.stripPhoto\s*\{[^}]*flex:\s*0 0 calc\(100% \/ 3\)/)
  })
})
