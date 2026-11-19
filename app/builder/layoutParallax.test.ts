import { describe, it, expect } from 'vitest'
import type { Data } from '@measured/puck'
import { buildHome, BLANK_HOME_WORDS } from './homeLayout'
import { buildAbout } from './aboutLayout'
import { buildWedding } from './weddingLayout'
import { buildPortraits } from './portraitsLayout'
import { buildMyWork } from './myWorkLayout'
import { buildContact } from './contactLayout'

// Step 5, item 6: the Rising Roots page layouts set the photo drift on every hero
// and every side-by-side photo, so new pages move like the reference site without
// Tynnell setting it block by block.

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
  const photoBlocks = data.content.filter((b) => b.type === 'Hero' || b.type === 'SplitImageText')

  it('has photo blocks to move', () => {
    expect(photoBlocks.length).toBeGreaterThan(0)
  })

  // Rising Roots keeps its hero photo still and drifts the large photos further
  // down the page (measured 2026-11-19), so heroes stand still and the side-by-side
  // photos use Strong.
  it('keeps every hero photo still and drifts every side-by-side photo at Strong', () => {
    const levels = photoBlocks.map((b) => [(b.props as Loose).id, (b.props as Loose).photoMovement])
    expect(levels).toEqual(photoBlocks.map((b) => [(b.props as Loose).id, b.type === 'Hero' ? 'none' : 'strong']))
  })

  it('leaves blocks with no photo of their own without the setting', () => {
    const others = data.content.filter((b) => b.type !== 'Hero' && b.type !== 'SplitImageText')
    expect(others.filter((b) => 'photoMovement' in (b.props as Loose))).toEqual([])
  })
})
