import { describe, it, expect } from 'vitest'
import { assertExpectedState } from './publish-placeholder-pages'

const doc = (n: number) => ({ root: {}, content: Array.from({ length: n }, () => ({ type: 'Hero', props: {} })) })

describe('placeholder publish guards', () => {
  it('accepts each page in exactly the state it was left in', () => {
    expect(() => assertExpectedState({ id: 39, slug: 'contact', published: true, content: doc(1), draft_content: doc(5) })).not.toThrow()
    expect(() => assertExpectedState({ id: 51, slug: 'wedding-photography', published: false, content: doc(13), draft_content: null })).not.toThrow()
  })

  it('refuses a page it does not publish, such as About', () => {
    expect(() => assertExpectedState({ id: 33, slug: 'about', published: true, content: doc(9), draft_content: null })).toThrow(/not one/)
  })

  it('refuses a page that was edited since, or whose state changed', () => {
    expect(() => assertExpectedState({ id: 39, slug: 'contact', published: true, content: doc(1), draft_content: doc(6) })).toThrow(/edited/)
    expect(() => assertExpectedState({ id: 52, slug: 'portraits', published: true, content: doc(13), draft_content: null })).toThrow(/published/)
    expect(() => assertExpectedState({ id: 52, slug: 'portraits', published: false, content: doc(13), draft_content: doc(2) })).toThrow(/draft/)
    expect(() => assertExpectedState({ id: 44, slug: 'other', published: true, content: doc(2), draft_content: doc(8) })).toThrow(/slug/)
  })
})
