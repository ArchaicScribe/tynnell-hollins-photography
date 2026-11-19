// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const block = (config.components as Record<string, any>).Steps

function renderSteps(props: Record<string, unknown>, puck: Record<string, unknown> = {}) {
  return render(block.render({ ...block.defaultProps, ...props, puck }) as ReactElement)
}

describe('Steps block', () => {
  it('numbers the steps 01, 02, 03 from their position', () => {
    const { container } = renderSteps({
      steps: [
        { title: 'Inquire', body: 'Tell me about your day.' },
        { title: 'Consult', body: '' },
        { title: 'Book', body: '' },
      ],
    })

    const numbers = [...container.querySelectorAll('li [data-step-number]')].map((n) => n.textContent)
    expect(numbers).toEqual(['01', '02', '03'])
    expect(screen.getByText('Tell me about your day.')).toBeInTheDocument()
  })

  it('skips a blank step and renumbers the next one', () => {
    const { container } = renderSteps({
      steps: [{ title: 'Inquire', body: '' }, { title: '   ', body: 'orphan body' }, { title: 'Book', body: '' }],
    })

    const numbers = [...container.querySelectorAll('li')].map((li) => li.textContent)
    expect(numbers).toEqual(['01Inquire', '02Book'])
    expect(screen.queryByText('orphan body')).toBeNull()
  })

  it('renders nothing for a visitor while blank', () => {
    const { container } = renderSteps({})

    expect(container.innerHTML).toBe('')
  })

  it('shows the dashed outline in the editor while blank', () => {
    renderSteps({}, { isEditing: true })

    expect(screen.getByText('Add your words here: booking steps')).toBeInTheDocument()
  })

  it('ships with no invented words and at most six steps', () => {
    expect(block.defaultProps.heading).toBe('')
    expect(block.defaultProps.steps.length).toBeLessThanOrEqual(6)
    for (const step of block.defaultProps.steps) {
      expect(Object.values(step).every((v) => v === '')).toBe(true)
    }
    expect(block.fields.steps.max).toBe(6)
  })

  it('is offered in the block drawer and has the hide switch and style controls', () => {
    const offered = Object.values(config.categories ?? {}).flatMap((c) => c.components ?? [])

    expect(offered).toContain('Steps')
    expect(block.defaultProps.hideUntilFilled).toBe(true)
    expect(Object.keys(block.fields)).toEqual(
      expect.arrayContaining(['background', 'spacing', 'hideOnMobile', 'hideOnDesktop', 'hideUntilFilled']),
    )
  })
})
