// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import type { Data } from '@measured/puck'
import { fillPlaceholders } from './placeholderWords'
import { buildWedding } from './weddingLayout'
import { buildPortraits } from './portraitsLayout'
import { buildMyWork } from './myWorkLayout'
import { buildContact } from './contactLayout'
import { config } from './puck.config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components = config.components as Record<string, any>

const pages: [string, Data][] = [
  ['wedding', buildWedding()],
  ['portraits', buildPortraits()],
  ['my work', buildMyWork()],
  ['contact', buildContact()],
]

type Loose = Record<string, unknown>

// Every string in a block's props, with its path, for comparing before/after.
function strings(v: unknown, path = ''): [string, string][] {
  if (typeof v === 'string') return [[path, v]]
  if (Array.isArray(v)) return v.flatMap((x, i) => strings(x, `${path}[${i}]`))
  if (v && typeof v === 'object') return Object.entries(v as Loose).flatMap(([k, x]) => strings(x, `${path}.${k}`))
  return []
}

function visibleText(data: Data): string {
  return data.content
    .map((b) => {
      const block = components[b.type]
      const { container } = render(block.render({ ...block.defaultProps, ...b.props, puck: {} }) as ReactElement)
      return container.textContent
    })
    .join(' ')
}

describe.each(pages)('placeholder words on the %s page', (_name, blank) => {
  const filled = fillPlaceholders(blank)

  it('keeps every block, in the same order, with the same ids', () => {
    expect(filled.content.map((b) => [b.type, (b.props as Loose).id])).toEqual(blank.content.map((b) => [b.type, (b.props as Loose).id]))
  })

  it('writes obvious dummy text: marked as a placeholder, with no digits, prices or currency', () => {
    const before = new Map(blank.content.flatMap((b) => strings(b.props, String((b.props as Loose).id))))
    const added = filled.content
      .flatMap((b) => strings(b.props, String((b.props as Loose).id)))
      .filter(([path, value]) => value !== before.get(path))

    expect(added.length).toBeGreaterThan(0)
    for (const [path, value] of added) {
      // Links and a few plain labels are not words; everything else must say so.
      if (/\.(href|buttonHref)$/.test(path)) continue
      expect(value, path).not.toMatch(/[$€£\d]/)
    }
    expect(visibleText(filled)).toContain('[Placeholder]')
  })

  it('leaves packages and numbers hidden, because they would need invented prices or counts', () => {
    for (const b of filled.content.filter((x) => ['Packages', 'StatsRow'].includes(x.type))) {
      const block = components[b.type]
      const { container } = render(block.render({ ...block.defaultProps, ...b.props, puck: {} }) as ReactElement)
      expect(container.innerHTML, b.type).toBe('')
    }
  })

  it('does not overwrite words that are already there', () => {
    const carried = buildMyWork({ heroEyebrow: 'Portfolio', heroHeading: 'Selected Work' })
    const hero = fillPlaceholders(carried).content[0].props as Loose

    expect(hero.eyebrow).toBe('Portfolio')
    expect(hero.heading).toBe('Selected Work')
  })
})
