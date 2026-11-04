import { describe, it, expect } from 'vitest'
import { extractSavedRanges } from './savedRanges'

const sent = [{ internalLabel: 'new trip' }]

describe('extractSavedRanges', () => {
  it('reads ranges from the { message, result } shape Payload returns', () => {
    const saved = [{ id: 'a', internalLabel: 'old trip' }, { id: 'b', internalLabel: 'new trip' }]
    const response = { message: 'Availability updated successfully.', result: { blockedRanges: saved } }
    expect(extractSavedRanges(response, sent)).toEqual(saved)
  })

  it('regression: never resets to an empty list when the top level has no ranges', () => {
    const response = { message: 'Availability updated successfully.', result: {} }
    expect(extractSavedRanges(response, sent)).toEqual(sent)
  })

  it('keeps a genuinely empty saved list', () => {
    const response = { message: 'ok', result: { blockedRanges: [] } }
    expect(extractSavedRanges(response, sent)).toEqual([])
  })

  it('accepts a bare document as well', () => {
    const saved = [{ id: 'a' }]
    expect(extractSavedRanges({ blockedRanges: saved }, sent)).toEqual(saved)
  })

  it('falls back on a null or malformed body', () => {
    expect(extractSavedRanges(null, sent)).toEqual(sent)
    expect(extractSavedRanges('nope', sent)).toEqual(sent)
  })
})
