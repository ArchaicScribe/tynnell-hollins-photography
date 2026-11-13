import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

// next/font/local sets each font variable (--font-serif, ...) through a class
// on <html>, pointing at the face it actually registered ('cormorant', not
// 'Cormorant Garamond'). tokens.css also declares those variables, as a
// fallback for pages that never load the fonts. A `:root` rule has the same
// specificity as that class and comes later, so it WON, and every heading
// asked for a family name that does not exist and rendered in Times.
//
// The fallbacks must therefore sit in a zero-specificity `:where(:root)` rule,
// where any next/font class beats them.
const tokens = readFileSync(path.resolve(__dirname, 'tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const fonts = readFileSync(path.resolve(__dirname, '../../fonts/fonts.ts'), 'utf8')

const fontVariables = [...new Set([...fonts.matchAll(/variable:\s*'(--[\w-]+)'/g)].map(m => m[1]))]

function rulesDeclaring(variable: string): string[] {
  const selectors: string[] = []
  for (const m of tokens.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (new RegExp(`(^|[\\s;])${variable}\\s*:`).test(m[2])) selectors.push(m[1].trim())
  }
  return selectors
}

describe('site tokens.css font fallbacks', () => {
  it('finds the font variables next/font owns', () => {
    expect(fontVariables).toEqual(
      expect.arrayContaining([
        '--font-display',
        '--font-heading',
        '--font-body',
        '--font-serif',
        '--font-sans',
        '--font-label',
        '--font-script',
      ]),
    )
  })

  for (const variable of fontVariables) {
    it(`does not override next/font's ${variable} (fallback is :where(:root), specificity 0)`, () => {
      const selectors = rulesDeclaring(variable)
      expect(selectors.length).toBeGreaterThan(0)
      expect(selectors.filter(s => s !== ':where(:root)')).toEqual([])
    })
  }
})
