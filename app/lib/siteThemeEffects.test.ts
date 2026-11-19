import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { DEFAULT_THEME, themeToCssVarMap, type SiteTheme } from './siteTheme'

// Scroll jank on the About page was measured on 2026-11-19: with the photo muting
// filter (saturate) and the full-screen paper grain layer switched off, slow
// frames dropped to a fraction. Two changes follow. (1) No filter at all when
// photos are at natural colour: `saturate(1)` does nothing visible but still
// makes the browser filter every large photo on every frame. (2) A "Performance
// mode" setting in /design that turns the muting and the grain off together.

const theme = (over: Partial<SiteTheme>): SiteTheme => ({ ...DEFAULT_THEME, ...over })

describe('photo filter', () => {
  it('is not applied at all when photos are at natural colour', () => {
    expect(themeToCssVarMap(theme({ photoTreatment: 'color' }))['--photo-filter']).toBe('none')
  })

  it.each([
    ['muted', 'saturate(0.65)'],
    ['faded', 'saturate(0.3)'],
    ['bw', 'saturate(0)'],
  ] as const)('is %s: %s', (photoTreatment, expected) => {
    expect(themeToCssVarMap(theme({ photoTreatment }))['--photo-filter']).toBe(expected)
  })

  it('is the only thing the stylesheet applies to photos, with no filter of its own left over', () => {
    const css = readFileSync(path.resolve(__dirname, '../(site)/globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = css.match(/img:not\(\.no-photo-treatment\)\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(rule).toContain('filter: var(--photo-filter, none)')
    expect(rule).not.toContain('saturate(')
  })
})

describe('performance mode', () => {
  it('is off by default, so nothing changes until it is switched on', () => {
    expect(DEFAULT_THEME.performanceMode).toBe(false)
  })

  it('leaves muting and grain exactly as chosen while it is off', () => {
    const vars = themeToCssVarMap(theme({ performanceMode: false, photoTreatment: 'muted', paperGrain: 'medium' }))

    expect(vars['--photo-filter']).toBe('saturate(0.65)')
    expect(vars['--paper-grain-opacity']).toBe('0.06')
  })

  it('turns the photo filter and the paper grain off together, whatever was chosen', () => {
    const vars = themeToCssVarMap(theme({ performanceMode: true, photoTreatment: 'muted', paperGrain: 'strong' }))

    expect(vars['--photo-filter']).toBe('none')
    expect(vars['--paper-grain-opacity']).toBe('0')
  })

  it('keeps the rest of the look: colours and fonts are untouched', () => {
    const on = themeToCssVarMap(theme({ performanceMode: true, colorBg: '#E4E2D8' }))

    expect(on['--color-bg']).toBe('#E4E2D8')
  })
})

// The grain is a full-viewport fixed layer. At opacity 0 the browser skips
// painting it but can still keep the layer, so it is removed outright whenever
// it would be invisible: no grain chosen, or Performance mode.
describe('paper grain layer', () => {
  it('is removed outright when no grain is chosen', () => {
    expect(themeToCssVarMap(theme({ paperGrain: 'none' }))['--paper-grain-display']).toBe('none')
  })

  it('is shown when a grain is chosen', () => {
    expect(themeToCssVarMap(theme({ paperGrain: 'medium' }))['--paper-grain-display']).toBe('block')
  })

  it('is removed outright in Performance mode, whatever grain was chosen', () => {
    expect(themeToCssVarMap(theme({ performanceMode: true, paperGrain: 'strong' }))['--paper-grain-display']).toBe('none')
  })

  it('is driven by that variable in the stylesheet', () => {
    const css = readFileSync(path.resolve(__dirname, '../(site)/globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = css.match(/body::before\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(rule).toContain('display: var(--paper-grain-display, none)')
  })
})

// The column is added by scripts/migrate-db.mjs, which the Vercel build runs
// before the new code ships. Nothing else fails if the line is dropped: the site
// would quietly fall back to the default theme.
describe('performance_mode column', () => {
  it('is added by the migration script', () => {
    const script = readFileSync(path.resolve(__dirname, '../../scripts/migrate-db.mjs'), 'utf8')

    expect(script).toMatch(/ALTER TABLE "site_design" ADD COLUMN IF NOT EXISTS "performance_mode" boolean DEFAULT false/)
  })
})
