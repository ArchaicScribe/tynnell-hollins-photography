import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { isoToLocalInput, localInputToIso } from './datetimeLocal'

describe('datetime-local conversion', () => {
  const originalTz = process.env.TZ

  // Pin a timezone behind UTC so the bug (treating UTC clock time as local)
  // would be visible regardless of where the suite runs.
  beforeAll(() => { process.env.TZ = 'America/New_York' })
  afterAll(() => { process.env.TZ = originalTz })

  it('shows a UTC timestamp as local wall-clock time', () => {
    // 15:30 UTC on 2026-11-10 is 10:30 in New York (EST, UTC-5).
    expect(isoToLocalInput('2026-11-10T15:30:00.000Z')).toBe('2026-11-10T10:30')
  })

  it('converts local wall-clock time back to UTC', () => {
    expect(localInputToIso('2026-11-10T10:30')).toBe('2026-11-10T15:30:00.000Z')
  })

  it('regression: a value round-trips unchanged instead of drifting on every blur', () => {
    const stored = '2026-07-04T02:15:00.000Z'
    let value = stored
    for (let i = 0; i < 3; i++) value = localInputToIso(isoToLocalInput(value))!
    expect(value).toBe(stored)
  })

  it('handles missing or invalid values without throwing', () => {
    expect(isoToLocalInput('')).toBe('')
    expect(isoToLocalInput(null)).toBe('')
    expect(isoToLocalInput('garbage')).toBe('')
    expect(localInputToIso('')).toBeNull()
    expect(localInputToIso('garbage')).toBeNull()
  })
})
