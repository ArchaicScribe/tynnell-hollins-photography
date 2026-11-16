// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const block = (config.components as Record<string, any>).Statement

function renderStatement(props: Record<string, unknown>, puck: Record<string, unknown> = {}) {
  return render(block.render({ ...block.defaultProps, ...props, puck }) as ReactElement)
}

describe('Statement block', () => {
  it('shows the lead-in in bold, then the text, then the closing line, in that order', () => {
    const { container } = renderStatement({ lead: 'Time keeps moving', text: 'Whether we are ready or not.', closing: 'Unless you capture it.' })

    expect(container.querySelector('strong')?.textContent).toBe('Time keeps moving')
    const order = container.textContent ?? ''
    expect(order.indexOf('Time keeps moving')).toBeLessThan(order.indexOf('Whether we are ready or not.'))
    expect(order.indexOf('Whether we are ready or not.')).toBeLessThan(order.indexOf('Unless you capture it.'))
  })

  it('the Pull quote style renders a blockquote', () => {
    const { container } = renderStatement({ style: 'quote', text: 'To love and to hold' })

    expect(container.querySelector('blockquote')?.textContent).toContain('To love and to hold')
  })

  it('renders nothing for a visitor while every word is blank', () => {
    const { container } = renderStatement({})

    expect(container.innerHTML).toBe('')
  })

  it('shows the dashed outline in the editor while blank', () => {
    renderStatement({}, { isEditing: true })

    expect(screen.getByText('Add your words here: statement')).toBeInTheDocument()
  })

  it('is offered in the builder block drawer', () => {
    const offered = Object.values(config.categories ?? {}).flatMap((c) => c.components ?? [])

    expect(offered).toContain('Statement')
  })

  it('has the standard style and per-device controls and the hide switch', () => {
    expect(Object.keys(block.fields)).toEqual(
      expect.arrayContaining(['background', 'spacing', 'hideOnMobile', 'hideOnDesktop', 'hideUntilFilled']),
    )
  })
})
