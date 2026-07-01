import { describe, it, expect } from 'vitest'
import { getBlockedDateResult, getActiveOoo, type BlockedRange } from './availability'

function isoDateOffset(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

describe('getBlockedDateResult', () => {
  it('flags a date inside a blocked range', () => {
    const ranges: BlockedRange[] = [
      { startDate: isoDateOffset(5), endDate: isoDateOffset(10), applyReturnBuffer: false },
    ]
    const result = getBlockedDateResult(isoDateOffset(7), ranges)
    expect(result?.blocked).toBe(true)
  })

  it('returns null for a date outside all ranges', () => {
    const ranges: BlockedRange[] = [
      { startDate: isoDateOffset(5), endDate: isoDateOffset(10), applyReturnBuffer: false },
    ]
    const result = getBlockedDateResult(isoDateOffset(20), ranges)
    expect(result).toBeNull()
  })

  it('flags a date exactly on the start boundary', () => {
    const ranges: BlockedRange[] = [
      { startDate: isoDateOffset(5), endDate: isoDateOffset(10), applyReturnBuffer: false },
    ]
    const result = getBlockedDateResult(isoDateOffset(5), ranges)
    expect(result?.blocked).toBe(true)
  })

  it('flags a date exactly on the end boundary', () => {
    const ranges: BlockedRange[] = [
      { startDate: isoDateOffset(5), endDate: isoDateOffset(10), applyReturnBuffer: false },
    ]
    const result = getBlockedDateResult(isoDateOffset(10), ranges)
    expect(result?.blocked).toBe(true)
  })

  it('uses the custom message when the range has one', () => {
    const ranges: BlockedRange[] = [
      {
        startDate: isoDateOffset(5),
        endDate: isoDateOffset(10),
        applyReturnBuffer: false,
        customerMessage: 'Back on {returnDate}!',
      },
    ]
    const result = getBlockedDateResult(isoDateOffset(7), ranges)
    expect(result?.message).toContain('Back on')
    expect(result?.message).not.toContain('{returnDate}')
  })

  it('extends the blocked window by the return buffer', () => {
    const ranges: BlockedRange[] = [
      {
        startDate: isoDateOffset(5),
        endDate: isoDateOffset(10),
        applyReturnBuffer: true,
        returnBufferDays: 3,
      },
    ]
    // Day 12 is within the original end (10) + 3 day buffer
    const result = getBlockedDateResult(isoDateOffset(12), ranges)
    expect(result?.blocked).toBe(true)
  })

  it('rejects a malformed date string', () => {
    const ranges: BlockedRange[] = [{ startDate: isoDateOffset(5), endDate: isoDateOffset(10) }]
    expect(getBlockedDateResult('not-a-date', ranges)).toBeNull()
  })
})

describe('getActiveOoo', () => {
  it('returns the active range when today falls inside it', () => {
    const ranges: BlockedRange[] = [
      { startDate: isoDateOffset(-2), endDate: isoDateOffset(2), applyReturnBuffer: false },
    ]
    expect(getActiveOoo(ranges)).not.toBeNull()
  })

  it('returns null when today is outside all ranges', () => {
    const ranges: BlockedRange[] = [
      { startDate: isoDateOffset(10), endDate: isoDateOffset(20), applyReturnBuffer: false },
    ]
    expect(getActiveOoo(ranges)).toBeNull()
  })

  it('returns the first active range among multiple overlapping ranges', () => {
    const ranges: BlockedRange[] = [
      { startDate: isoDateOffset(-5), endDate: isoDateOffset(5), applyReturnBuffer: false, internalLabel: 'first' },
      { startDate: isoDateOffset(-1), endDate: isoDateOffset(1), applyReturnBuffer: false, internalLabel: 'second' },
    ]
    const active = getActiveOoo(ranges)
    expect(active).not.toBeNull()
  })

  it('skips ranges missing a start or end date', () => {
    const ranges: BlockedRange[] = [{ startDate: null, endDate: null }]
    expect(getActiveOoo(ranges)).toBeNull()
  })
})
