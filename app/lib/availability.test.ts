import { describe, it, expect } from 'vitest'
import { getBlockedDateResult, getActiveOoo, parseLocalDate, type BlockedRange } from './availability'

/** Local calendar day `days` from today as "YYYY-MM-DD", the shape a booking form submits. */
function dayOffset(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/**
 * The same day as a Payload date field value. Payload's drizzle adapter returns
 * date fields as full ISO timestamps, and the availability editor saves each day
 * as UTC midnight, so range fixtures must use this shape, not "YYYY-MM-DD".
 */
function isoDateOffset(days: number): string {
  return `${dayOffset(days)}T00:00:00.000Z`
}

describe('parseLocalDate', () => {
  it('parses a Payload ISO timestamp as local midnight of its calendar day', () => {
    const d = parseLocalDate('2026-11-10T00:00:00.000Z')
    expect(Number.isNaN(d.getTime())).toBe(false)
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 10])
    expect([d.getHours(), d.getMinutes()]).toEqual([0, 0])
  })

  it('ignores the time portion of a non-midnight timestamp', () => {
    const d = parseLocalDate('2026-11-10T17:00:00.000Z')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 10])
  })

  it('still accepts a bare YYYY-MM-DD string', () => {
    const d = parseLocalDate('2026-11-10')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 10])
  })
})

describe('getBlockedDateResult', () => {
  it('flags a date inside a blocked range', () => {
    const ranges: BlockedRange[] = [
      { startDate: isoDateOffset(5), endDate: isoDateOffset(10), applyReturnBuffer: false },
    ]
    const result = getBlockedDateResult(dayOffset(7), ranges)
    expect(result?.blocked).toBe(true)
  })

  it('returns null for a date outside all ranges', () => {
    const ranges: BlockedRange[] = [
      { startDate: isoDateOffset(5), endDate: isoDateOffset(10), applyReturnBuffer: false },
    ]
    const result = getBlockedDateResult(dayOffset(20), ranges)
    expect(result).toBeNull()
  })

  it('flags a date exactly on the start boundary', () => {
    const ranges: BlockedRange[] = [
      { startDate: isoDateOffset(5), endDate: isoDateOffset(10), applyReturnBuffer: false },
    ]
    const result = getBlockedDateResult(dayOffset(5), ranges)
    expect(result?.blocked).toBe(true)
  })

  it('flags a date exactly on the end boundary', () => {
    const ranges: BlockedRange[] = [
      { startDate: isoDateOffset(5), endDate: isoDateOffset(10), applyReturnBuffer: false },
    ]
    const result = getBlockedDateResult(dayOffset(10), ranges)
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
    const result = getBlockedDateResult(dayOffset(7), ranges)
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
    const result = getBlockedDateResult(dayOffset(12), ranges)
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
      { startDate: isoDateOffset(-5), endDate: isoDateOffset(5), applyReturnBuffer: false, customerMessage: 'first range' },
      { startDate: isoDateOffset(-1), endDate: isoDateOffset(1), applyReturnBuffer: false, customerMessage: 'second range' },
    ]
    expect(getActiveOoo(ranges)?.message).toBe('first range')
  })

  it('skips ranges missing a start or end date', () => {
    const ranges: BlockedRange[] = [{ startDate: null, endDate: null }]
    expect(getActiveOoo(ranges)).toBeNull()
  })
})

describe('regression: Payload ISO timestamps (blocked dates never fired)', () => {
  // Before the fix, parseLocalDate split "2026-11-10T00:00:00.000Z" on "-" and
  // got a NaN day, so every comparison was false and nothing was ever blocked.
  const ranges: BlockedRange[] = [
    { startDate: isoDateOffset(5), endDate: isoDateOffset(10), applyReturnBuffer: false },
  ]

  it('blocks a submitted date inside a range read back from Payload', () => {
    expect(getBlockedDateResult(dayOffset(7), ranges)?.blocked).toBe(true)
  })

  it('does not block the day before the range starts', () => {
    expect(getBlockedDateResult(dayOffset(4), ranges)).toBeNull()
  })

  it('does not block the day after the range ends', () => {
    expect(getBlockedDateResult(dayOffset(11), ranges)).toBeNull()
  })

  it('blocks a date when Payload returns a noon timestamp for the range', () => {
    const noon: BlockedRange[] = [
      { startDate: `${dayOffset(5)}T12:00:00.000Z`, endDate: `${dayOffset(10)}T12:00:00.000Z`, applyReturnBuffer: false },
    ]
    expect(getBlockedDateResult(dayOffset(7), noon)?.blocked).toBe(true)
  })

  it('reports an active OOO for a range read back from Payload', () => {
    const active: BlockedRange[] = [
      { startDate: isoDateOffset(0), endDate: isoDateOffset(0), applyReturnBuffer: false },
    ]
    expect(getActiveOoo(active)).not.toBeNull()
  })
})
