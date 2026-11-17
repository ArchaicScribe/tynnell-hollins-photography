import { describe, it, expect } from 'vitest'
import { packagesIsEmpty, stepsIsEmpty, columnsIsEmpty, faqIsEmpty, linesOf } from './emptyRules'

describe('packagesIsEmpty', () => {
  it('is empty with no cards, or cards missing a name or a price', () => {
    expect(packagesIsEmpty({})).toBe(true)
    expect(packagesIsEmpty({ cards: [] })).toBe(true)
    expect(packagesIsEmpty({ cards: [{ name: 'Full day', price: '' }] })).toBe(true)
    expect(packagesIsEmpty({ cards: [{ name: '', price: '$4,000' }] })).toBe(true)
  })

  it('treats whitespace-only words as empty', () => {
    expect(packagesIsEmpty({ cards: [{ name: '   ', price: '\n ' }] })).toBe(true)
  })

  it('is filled once one card has a name and a price', () => {
    expect(packagesIsEmpty({ cards: [{ name: '' }, { name: 'Full day', price: '$4,000' }] })).toBe(false)
  })
})

describe('stepsIsEmpty', () => {
  it('is empty with no step titles, including whitespace-only ones', () => {
    expect(stepsIsEmpty({})).toBe(true)
    expect(stepsIsEmpty({ steps: [{ title: '' }, { title: '   ' }] })).toBe(true)
  })

  it('is filled once one step has a title', () => {
    expect(stepsIsEmpty({ steps: [{ title: '' }, { title: 'Inquire' }] })).toBe(false)
  })
})

describe('columnsIsEmpty', () => {
  it('is empty when no column has both a title and a line', () => {
    expect(columnsIsEmpty({})).toBe(true)
    expect(columnsIsEmpty({ columns: [{ title: 'Included', lines: '' }] })).toBe(true)
    expect(columnsIsEmpty({ columns: [{ title: '', lines: 'Eight hours' }] })).toBe(true)
  })

  it('treats whitespace-only titles and lines as empty', () => {
    expect(columnsIsEmpty({ columns: [{ title: '  ', lines: 'Eight hours' }] })).toBe(true)
    expect(columnsIsEmpty({ columns: [{ title: 'Included', lines: '\n \n' }] })).toBe(true)
  })

  it('is filled once one column has a title and a line', () => {
    expect(columnsIsEmpty({ columns: [{ title: 'Included', lines: '\nEight hours\n' }] })).toBe(false)
  })
})

describe('faqIsEmpty', () => {
  it('is empty when no item has both a title and a body', () => {
    expect(faqIsEmpty({})).toBe(true)
    expect(faqIsEmpty({ items: [{ title: 'Q', body: '' }, { title: '', body: 'A' }] })).toBe(true)
    expect(faqIsEmpty({ items: [{ title: '   ', body: '   ' }] })).toBe(true)
  })

  it('is filled once one item has a title and a body', () => {
    expect(faqIsEmpty({ items: [{ title: 'Q', body: 'A' }] })).toBe(false)
  })
})

describe('linesOf', () => {
  it('splits on newlines, trims, and drops blanks', () => {
    expect(linesOf('a\n\n b \n')).toEqual(['a', 'b'])
  })

  it('gives an empty list for missing or blank text', () => {
    expect(linesOf(undefined)).toEqual([])
    expect(linesOf(' \n ')).toEqual([])
  })
})
