import { describe, it, expect } from 'vitest'
import type { Data } from '@measured/puck'
import { config } from './puck.config'
import { buildHome, BLANK_HOME_WORDS } from './homeLayout'
import { buildAbout } from './aboutLayout'
import { buildWedding } from './weddingLayout'
import { buildPortraits } from './portraitsLayout'
import { buildMyWork } from './myWorkLayout'
import { buildContact } from './contactLayout'

// Step 5: Rising Roots has one continuous paper background with no visible
// edges between sections. A solid section fill (the old call to action's
// accent colour) shows as a lighter or darker band with a hard line, so the page
// layouts leave every section transparent. Tynnell can still pick a fill per
// block in the builder.

type Loose = Record<string, unknown>
const pages: [string, Data][] = [
  ['home', buildHome(BLANK_HOME_WORDS)],
  ['about', buildAbout()],
  ['wedding', buildWedding()],
  ['portraits', buildPortraits()],
  ['my work', buildMyWork()],
  ['contact', buildContact()],
]

describe.each(pages)('the %s layout', (_name, data) => {
  it('gives no section a solid background fill', () => {
    const fills = data.content
      .map((b) => [(b.props as Loose).id, (b.props as Loose).background] as const)
      .filter(([, bg]) => bg !== undefined && bg !== 'transparent')
    expect(fills).toEqual([])
  })
})

describe('the Home hero', () => {
  const hero = buildHome(BLANK_HOME_WORDS).content[0]

  it('fills the whole screen, like the Rising Roots hero', () => {
    expect(hero.type).toBe('Hero')
    expect((hero.props as Loose).height).toBe('100vh')
  })

  it('is a height the editor offers, so the Height control shows it', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const heroConfig = config.components.Hero as any
    const values = heroConfig.fields.height.options.map((o: { value: string }) => o.value)
    expect(values).toContain('100vh')
  })
})
