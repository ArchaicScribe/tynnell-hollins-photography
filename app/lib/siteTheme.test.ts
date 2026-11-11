import { describe, it, expect } from 'vitest'
import { DEFAULT_THEME, OPTIONAL_THEME_VARS, themeToCssVarMap, themeToCssVars, type SiteTheme } from './siteTheme'
import { SITE_DESIGN_FIELDS } from '@/test/siteDesignFields'

function isRealCssValue(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0 && !value.includes('undefined')
}

describe('themeToCssVarMap', () => {
  // Every select in the /design editor feeds a lookup table here (fonts,
  // grain, shadow, saturation, spacing, radius). An option added to the
  // global without a matching table entry emits `undefined` into the
  // site-wide <style> and silently breaks that property on every page.
  const selects = SITE_DESIGN_FIELDS.filter((f) => f.type === 'select')

  for (const field of selects) {
    for (const option of field.options) {
      it(`emits a real CSS value for ${field.name} = ${option}`, () => {
        const theme = { ...DEFAULT_THEME, [field.name]: option } as SiteTheme

        const map = themeToCssVarMap(theme)

        for (const [cssVar, value] of Object.entries(map)) {
          expect(isRealCssValue(value), `${cssVar} is ${JSON.stringify(value)}`).toBe(true)
        }
      })
    }
  }

  it('wires each color field to its own CSS variable', () => {
    const theme: SiteTheme = {
      ...DEFAULT_THEME,
      colorBg: '#000001',
      colorBgAccent: '#000002',
      colorHeading: '#000003',
      colorBody: '#000004',
      colorDetail: '#000005',
      colorBtnBg: '#000006',
      colorBgCard: '#000007',
      colorBgHover: '#000008',
      colorBgOverlay: '#000009',
      colorBtnText: '#00000a',
      colorBtnHover: '#00000b',
      colorBorder: '#00000c',
      colorBorderSubtle: '#00000d',
      colorBorderSolid: '#00000e',
      tapeMatColor: '#00000f',
      tapeColor: '#000010',
    }

    const map = themeToCssVarMap(theme)

    expect(map).toMatchObject({
      '--color-bg': '#000001',
      '--color-bg-accent': '#000002',
      '--color-heading': '#000003',
      '--color-body': '#000004',
      '--color-detail': '#000005',
      '--color-btn-bg': '#000006',
      '--color-bg-card': '#000007',
      '--color-bg-hover': '#000008',
      '--color-bg-overlay': '#000009',
      '--color-btn-text': '#00000a',
      '--color-btn-hover': '#00000b',
      '--color-border': '#00000c',
      '--color-border-subtle': '#00000d',
      '--color-border-solid': '#00000e',
      '--tape-mat': '#00000f',
      '--tape-color': '#000010',
    })
  })

  // TYN-352. The navbar's solid colours follow the button colours until
  // Tynnell picks her own, so the live site does not change on deploy. A
  // default colour here would replace the olive she already has, so the
  // variables are only written once a value is saved.
  describe('navbar colors', () => {
    it('writes no navbar variables until a color is saved', () => {
      const map = themeToCssVarMap(DEFAULT_THEME)

      expect(map).not.toHaveProperty('--color-nav-bg')
      expect(map).not.toHaveProperty('--color-nav-text')
    })

    it('writes the navbar background and text colors once saved', () => {
      const map = themeToCssVarMap({ ...DEFAULT_THEME, colorNavBg: '#102030', colorNavText: '#f0e0d0' })

      expect(map['--color-nav-bg']).toBe('#102030')
      expect(map['--color-nav-text']).toBe('#f0e0d0')
    })

    // The live preview removes exactly the variables listed in
    // OPTIONAL_THEME_VARS when a draft drops them. One the map writes but the
    // list omits would stick in the preview after being cleared.
    it('lists every variable that only exists while set, so the preview can clear it', () => {
      const all = themeToCssVarMap({ ...DEFAULT_THEME, colorNavBg: '#102030', colorNavText: '#f0e0d0' })
      const optional = Object.keys(all).filter((k) => !(k in themeToCssVarMap(DEFAULT_THEME)))

      expect([...OPTIONAL_THEME_VARS].sort()).toEqual(optional.sort())
    })

    // A stray space typed into the box is truthy, would define the variable
    // as blank, and a defined variable never takes the var() fallback, so the
    // bar would vanish instead of following the button colors.
    it('treats a blank navbar color as not set', () => {
      const map = themeToCssVarMap({ ...DEFAULT_THEME, colorNavBg: '   ', colorNavText: ' ' })

      expect(map).not.toHaveProperty('--color-nav-bg')
      expect(map).not.toHaveProperty('--color-nav-text')
    })

    it('trims the navbar color it writes', () => {
      const map = themeToCssVarMap({ ...DEFAULT_THEME, colorNavBg: '  #102030 ' })

      expect(map['--color-nav-bg']).toBe('#102030')
    })

    it('lets the background be set without the text, and the reverse', () => {
      const bgOnly = themeToCssVarMap({ ...DEFAULT_THEME, colorNavBg: '#102030' })
      const textOnly = themeToCssVarMap({ ...DEFAULT_THEME, colorNavText: '#f0e0d0' })

      expect(bgOnly).toHaveProperty('--color-nav-bg')
      expect(bgOnly).not.toHaveProperty('--color-nav-text')
      expect(textOnly).toHaveProperty('--color-nav-text')
      expect(textOnly).not.toHaveProperty('--color-nav-bg')
    })
  })

  it('leaves heading and body fonts to tokens.css when they are Poppins', () => {
    const map = themeToCssVarMap({ ...DEFAULT_THEME, headingFont: 'poppins', bodyFont: 'poppins' })

    expect(map).not.toHaveProperty('--font-heading')
    expect(map).not.toHaveProperty('--font-body')
  })

  it('overrides the heading font when a non-default face is chosen', () => {
    const map = themeToCssVarMap({ ...DEFAULT_THEME, headingFont: 'cormorant', bodyFont: 'barlow' })

    expect(map['--font-heading']).toBe('var(--font-serif)')
    expect(map['--font-body']).toBe('var(--font-sans)')
  })
})

describe('themeToCssVars', () => {
  it('renders one declaration per variable for the root <style> tag', () => {
    const css = themeToCssVars({ ...DEFAULT_THEME, colorBg: '#E4E2D8', paperGrain: 'medium' })

    expect(css).toContain('--color-bg: #E4E2D8;')
    expect(css).toContain('--paper-grain-opacity: 0.06;')
  })
})
