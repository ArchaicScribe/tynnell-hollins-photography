// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const block = (config.components as Record<string, any>).StatsRow

function renderStats(props: Record<string, unknown>) {
  return render(block.render({ ...block.defaultProps, ...props, puck: {} }) as ReactElement)
}

describe('StatsRow block', () => {
  it('shows every stat with its number and its label', () => {
    renderStats({
      items: [
        { value: '5★', label: 'Reviews on Google' },
        { value: '150+', label: 'Weddings photographed' },
        { value: '7+', label: 'Years behind the camera' },
      ],
    })

    expect(screen.getByText('5★')).toBeInTheDocument()
    expect(screen.getByText('Reviews on Google')).toBeInTheDocument()
    expect(screen.getByText('150+')).toBeInTheDocument()
    expect(screen.getByText('Weddings photographed')).toBeInTheDocument()
    expect(screen.getByText('7+')).toBeInTheDocument()
    expect(screen.getByText('Years behind the camera')).toBeInTheDocument()
  })

  it('leaves out a stat that has no number yet instead of showing an empty slot', () => {
    renderStats({
      items: [
        { value: '150+', label: 'Weddings photographed' },
        { value: '', label: 'Years behind the camera' },
      ],
    })

    expect(screen.getByText('150+')).toBeInTheDocument()
    expect(screen.queryByText('Years behind the camera')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('renders nothing visible when every stat is empty', () => {
    renderStats({ items: [{ value: '', label: '' }] })

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('is offered in the builder block drawer', () => {
    const offered = Object.values(config.categories ?? {}).flatMap((c) => c.components ?? [])

    expect(offered).toContain('StatsRow')
  })

  it('has the same background, spacing and per-device controls as every other block', () => {
    // CLAUDE.md style-exposure convention (TYN-338): Tynnell adjusts these
    // herself, so a block without them cannot be styled to match the page.
    expect(Object.keys(block.fields)).toEqual(
      expect.arrayContaining(['background', 'spacing', 'scrollOverlap', 'hideOnMobile', 'hideOnDesktop']),
    )
  })
})
