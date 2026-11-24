import { describe, it, expect } from 'vitest'
import { assertHomeState } from './fill-home-placeholders'

const doc = (n: number) => ({ root: {}, content: Array.from({ length: n }, () => ({ type: 'Hero', props: {} })) })
const home = { id: 43, slug: 'home-builder', published: true, content: doc(11), draft_content: null }

describe('Home placeholder guard', () => {
  it('accepts Home in exactly the state it was left in', () => {
    expect(() => assertHomeState(home)).not.toThrow()
  })

  it('refuses another page, an unpublished Home, a saved draft or an edited Home', () => {
    expect(() => assertHomeState({ ...home, id: 33, slug: 'about' })).toThrow(/not the Home/)
    expect(() => assertHomeState({ ...home, published: false })).toThrow(/not published/)
    expect(() => assertHomeState({ ...home, draft_content: doc(11) })).toThrow(/draft/)
    expect(() => assertHomeState({ ...home, content: doc(12) })).toThrow(/edited/)
  })
})
