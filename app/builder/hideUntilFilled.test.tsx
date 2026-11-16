// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GateEmpty } from './hideUntilFilled'
import {
  isBlank,
  statementIsEmpty,
  pathChoiceIsEmpty,
  statsIsEmpty,
  splitIsEmpty,
  ctaIsEmpty,
  albumsIsEmpty,
  testimonialsIsEmpty,
  signupIsEmpty,
} from './emptyRules'

describe('GateEmpty', () => {
  it('shows its children when the switch is off, even if empty', () => {
    render(<GateEmpty hide={false} empty label="stats"><p>content</p></GateEmpty>)
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('renders nothing for a visitor when on and empty', () => {
    const { container } = render(<GateEmpty hide empty editing={false} label="stats"><p>content</p></GateEmpty>)
    expect(container.innerHTML).toBe('')
  })

  it('shows a dashed outline naming the section while editing', () => {
    const { container } = render(<GateEmpty hide empty editing label="stats"><p>content</p></GateEmpty>)
    expect(screen.getByText('Add your words here: stats')).toBeInTheDocument()
    expect(screen.queryByText('content')).not.toBeInTheDocument()
    expect(container.querySelector('[data-empty-outline]')).not.toBeNull()
  })

  it('shows its children when on but filled', () => {
    render(<GateEmpty hide empty={false} label="stats"><p>content</p></GateEmpty>)
    expect(screen.getByText('content')).toBeInTheDocument()
  })
})

describe('empty rules', () => {
  it.each([
    ['', true],
    ['   ', true],
    [undefined, true],
    [42, true],
    ['x', false],
  ])('isBlank(%j) is %s', (value, expected) => {
    expect(isBlank(value)).toBe(expected)
  })

  it('statement is empty only when lead, text and closing are all blank', () => {
    expect(statementIsEmpty({ lead: ' ', text: '', closing: '' })).toBe(true)
    expect(statementIsEmpty({ text: 'x' })).toBe(false)
  })

  it('path choice needs a card with both a label and a link', () => {
    expect(pathChoiceIsEmpty({ cards: [{ label: 'A' }, { href: '/b' }] })).toBe(true)
    expect(pathChoiceIsEmpty({ cards: [{ label: 'A', href: '/a' }] })).toBe(false)
    expect(pathChoiceIsEmpty({})).toBe(true)
  })

  it('stats are empty when no stat has a number, whatever the heading', () => {
    expect(statsIsEmpty({ items: [{ value: '' }] })).toBe(true)
    expect(statsIsEmpty({ items: [{ value: '150+' }] })).toBe(false)
  })

  it('split, call to action, albums and testimonials follow their words', () => {
    expect(splitIsEmpty({ body: '', buttonText: '' })).toBe(true)
    expect(splitIsEmpty({ body: 'x' })).toBe(false)
    expect(ctaIsEmpty({ heading: '' })).toBe(true)
    expect(ctaIsEmpty({ heading: 'Book' })).toBe(false)
    expect(albumsIsEmpty([])).toBe(true)
    expect(albumsIsEmpty(undefined)).toBe(true)
    expect(albumsIsEmpty([{}])).toBe(false)
    expect(testimonialsIsEmpty([])).toBe(true)
    expect(testimonialsIsEmpty([{}])).toBe(false)
  })

  it('a sign-up needs words, and a freebie also needs its guide link to be ready', () => {
    expect(signupIsEmpty({ kind: 'newsletter', heading: 'Hi' }, undefined)).toBe(false)
    expect(signupIsEmpty({ kind: 'freebie', heading: 'Hi' }, false)).toBe(true)
    expect(signupIsEmpty({ kind: 'freebie', heading: 'Hi' }, undefined)).toBe(true)
    expect(signupIsEmpty({ kind: 'freebie', heading: 'Hi' }, true)).toBe(false)
    expect(signupIsEmpty({ kind: 'freebie', heading: '', body: '' }, true)).toBe(true)
  })
})
