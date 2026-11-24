import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { DEFAULT_THEME, themeToCssVarMap } from './siteTheme'
import { SCRIPT_FONT_OPTIONS } from '@/app/builder/DesignPanelShared'

// "Inquire now" on the reference is set in Nostalgia, a paid script face we cannot ship.
// Birthstone (free) is the closest match found on 2026-11-24: narrow, thin and slanted at
// the same size. It is a fourth choice for the script role, which needs every link of the
// theme chain: the font file, the layout class, the type, the CSS variable, the /design
// option, the Payload field option and the Postgres enum value.
const root = path.resolve(__dirname, '../..')
const read = (p: string) => readFileSync(path.join(root, p), 'utf8')

describe('Birthstone script font', () => {
  it('is offered in the /design editor and the Payload field', () => {
    expect(SCRIPT_FONT_OPTIONS.map((o) => o.value)).toContain('birthstone')
    expect(read('globals/SiteDesign.ts')).toMatch(/value:\s*'birthstone'/)
  })

  it('becomes the script role variable when chosen', () => {
    const map = themeToCssVarMap({ ...DEFAULT_THEME, scriptFont: 'birthstone' })

    expect(map['--font-script-role']).toBe('var(--font-script-birthstone)')
  })

  it('is loaded from the repo (a shipped file), and put on the site layout', () => {
    expect(read('app/fonts/fonts.ts')).toMatch(/export const birthstone = localFont\(/)
    expect(read('app/fonts/fonts.ts')).toMatch(/variable:\s*'--font-script-birthstone'/)
    expect(() => readFileSync(path.join(root, 'app/fonts/google/birthstone-400-normal.woff2'))).not.toThrow()
    expect(read('app/(site)/layout.tsx')).toMatch(/birthstone\.variable/)
  })

  it('is added to the Postgres enum, or saving it in /design would fail', () => {
    expect(read('scripts/migrate-db.mjs')).toMatch(/ALTER TYPE "enum_site_design_script_font" ADD VALUE IF NOT EXISTS 'birthstone'/)
  })
})
