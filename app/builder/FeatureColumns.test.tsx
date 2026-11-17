// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const block = (config.components as Record<string, any>).FeatureColumns

function renderColumns(props: Record<string, unknown>, puck: Record<string, unknown> = {}) {
  return render(block.render({ ...block.defaultProps, ...props, puck }) as ReactElement)
}

describe('Columns List block', () => {
  it('shows each column title as a heading with one bullet per non-blank line', () => {
    const { container } = renderColumns({
      columns: [
        { title: 'Before', lines: 'Consultation\n\nTimeline  ' },
        { title: 'Day of', lines: 'Eight hours' },
      ],
    })

    expect(screen.getByRole('heading', { name: 'Before' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Day of' })).toBeInTheDocument()
    expect([...container.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['Consultation', 'Timeline', 'Eight hours'])
  })

  it('skips a column that has a title but no lines', () => {
    renderColumns({ columns: [{ title: 'Empty one', lines: ' \n ' }, { title: 'Real', lines: 'A line' }] })

    expect(screen.queryByRole('heading', { name: 'Empty one' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Real' })).toBeInTheDocument()
  })

  it('renders a single filled column as exactly one list', () => {
    const { container } = renderColumns({ columns: [{ title: 'Why me', lines: 'One\nTwo' }, { title: '', lines: '' }] })

    expect(container.querySelectorAll('ul')).toHaveLength(1)
  })

  it('renders nothing for a visitor while blank', () => {
    const { container } = renderColumns({})

    expect(container.innerHTML).toBe('')
  })

  it('shows the dashed outline in the editor while blank', () => {
    renderColumns({}, { isEditing: true })

    expect(screen.getByText('Add your words here: columns')).toBeInTheDocument()
  })

  it('ships with no invented words and at most four columns', () => {
    expect(block.defaultProps.heading).toBe('')
    expect(block.defaultProps.columns.length).toBeLessThanOrEqual(4)
    for (const col of block.defaultProps.columns) {
      expect(Object.values(col).every((v) => v === '')).toBe(true)
    }
    expect(block.fields.columns.max).toBe(4)
  })

  it('is offered in the block drawer and has the hide switch and style controls', () => {
    const offered = Object.values(config.categories ?? {}).flatMap((c) => c.components ?? [])

    expect(offered).toContain('FeatureColumns')
    expect(block.defaultProps.hideUntilFilled).toBe(true)
    expect(Object.keys(block.fields)).toEqual(
      expect.arrayContaining(['background', 'spacing', 'hideOnMobile', 'hideOnDesktop', 'hideUntilFilled']),
    )
  })
})
