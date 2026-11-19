// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const block = (config.components as Record<string, any>).PathChoice

function renderChoice(props: Record<string, unknown>, puck: Record<string, unknown> = {}) {
  return render(block.render({ ...block.defaultProps, ...props, puck }) as ReactElement)
}

describe('PathChoice block', () => {
  it('shows each complete card as a link with its label', () => {
    renderChoice({
      cards: [
        { imageUrl: '/a.jpg', label: 'Getting married', href: '/weddings' },
        { imageUrl: '/b.jpg', label: 'Explore portraits', href: '/portraits' },
      ],
    })

    expect(screen.getByRole('link', { name: /Getting married/ })).toHaveAttribute('href', '/weddings')
    expect(screen.getByRole('link', { name: /Explore portraits/ })).toHaveAttribute('href', '/portraits')
  })

  it('takes up to four cards, each shown as a link', () => {
    renderChoice({ cards: ['A', 'B', 'C', 'D'].map((l) => ({ imageUrl: '', label: l, href: '/' + l })) })

    expect(screen.getAllByRole('link')).toHaveLength(4)
    expect(block.fields.cards.max).toBe(4)
  })

  it('leaves out a card that has no label or no link', () => {
    renderChoice({
      cards: [
        { imageUrl: '', label: 'Complete', href: '/a' },
        { imageUrl: '', label: 'No link yet', href: '' },
      ],
    })

    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('shows the heading above the cards', () => {
    renderChoice({ heading: 'What brings you here today?', cards: [{ imageUrl: '', label: 'A', href: '/a' }] })

    expect(screen.getByRole('heading', { name: 'What brings you here today?' })).toBeInTheDocument()
  })

  it('renders nothing for a visitor while no card is complete', () => {
    const { container } = renderChoice({})

    expect(container.innerHTML).toBe('')
  })

  it('shows the dashed outline in the editor', () => {
    renderChoice({}, { isEditing: true })

    expect(screen.getByText('Add your words here: choice cards')).toBeInTheDocument()
  })

  it('allows at most four cards and is offered in the drawer', () => {
    expect(block.fields.cards.max).toBe(4)
    const offered = Object.values(config.categories ?? {}).flatMap((c) => c.components ?? [])
    expect(offered).toContain('PathChoice')
  })
})
