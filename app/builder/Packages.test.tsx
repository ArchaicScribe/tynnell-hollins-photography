// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const block = (config.components as Record<string, any>).Packages

function renderPackages(props: Record<string, unknown>, puck: Record<string, unknown> = {}) {
  return render(block.render({ ...block.defaultProps, ...props, puck }) as ReactElement)
}

const full = {
  name: 'Full day',
  price: 'From $4,000',
  description: 'Eight hours of coverage.',
  features: 'Engagement session\n\nOnline gallery\n  Printed album  ',
  buttonText: '',
  buttonHref: '',
}

describe('Packages block', () => {
  it('shows a complete card with its name, price and description', () => {
    renderPackages({ cards: [full] })

    expect(screen.getByText('Full day')).toBeInTheDocument()
    expect(screen.getByText('From $4,000')).toBeInTheDocument()
    expect(screen.getByText('Eight hours of coverage.')).toBeInTheDocument()
  })

  it('lists one bullet per non-blank feature line', () => {
    const { container } = renderPackages({ cards: [full] })

    const items = [...container.querySelectorAll('li')].map((li) => li.textContent)
    expect(items).toEqual(['Engagement session', 'Online gallery', 'Printed album'])
  })

  it('skips a card with no price while still showing a complete one', () => {
    renderPackages({ cards: [{ ...full, name: 'Half day', price: '' }, full] })

    expect(screen.queryByText('Half day')).toBeNull()
    expect(screen.getByText('Full day')).toBeInTheDocument()
  })

  it('shows the card button only when both its text and link are set', () => {
    const { rerender } = renderPackages({ cards: [{ ...full, buttonText: 'Inquire', buttonHref: '' }] })
    expect(screen.queryByRole('link', { name: 'Inquire' })).toBeNull()

    rerender(block.render({ ...block.defaultProps, cards: [{ ...full, buttonText: 'Inquire', buttonHref: '#inquire' }], puck: {} }) as ReactElement)
    expect(screen.getByRole('link', { name: 'Inquire' })).toHaveAttribute('href', '#inquire')
  })

  it('renders nothing for a visitor while blank', () => {
    const { container } = renderPackages({})

    expect(container.innerHTML).toBe('')
  })

  it('shows the dashed outline in the editor while blank', () => {
    renderPackages({}, { isEditing: true })

    expect(screen.getByText('Add your words here: packages')).toBeInTheDocument()
  })

  it('ships with no invented words or prices', () => {
    expect(block.defaultProps.heading).toBe('')
    expect(block.defaultProps.cards.length).toBeLessThanOrEqual(3)
    for (const card of block.defaultProps.cards) {
      expect(Object.values(card).every((v) => v === '')).toBe(true)
    }
  })

  it('is offered in the block drawer and has the hide switch and style controls', () => {
    const offered = Object.values(config.categories ?? {}).flatMap((c) => c.components ?? [])

    expect(offered).toContain('Packages')
    expect(block.defaultProps.hideUntilFilled).toBe(true)
    expect(Object.keys(block.fields)).toEqual(
      expect.arrayContaining(['background', 'spacing', 'hideOnMobile', 'hideOnDesktop', 'hideUntilFilled']),
    )
    expect(block.fields.cards.max).toBe(3)
  })
})
