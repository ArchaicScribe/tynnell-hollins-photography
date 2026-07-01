import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  isValidPhone,
  isValidSessionDate,
  anyFieldTooLong,
  escapeHtml,
  MIN_LEAD_TIME_HOURS,
  MAX_BOOKING_MONTHS,
} from './validation'

describe('isValidEmail', () => {
  it('accepts a valid address', () => {
    expect(isValidEmail('hello@example.com')).toBe(true)
  })

  it('rejects an address missing @', () => {
    expect(isValidEmail('helloexample.com')).toBe(false)
  })

  it('rejects an address missing a TLD', () => {
    expect(isValidEmail('hello@example')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('rejects non-string values', () => {
    expect(isValidEmail(undefined)).toBe(false)
    expect(isValidEmail(12345)).toBe(false)
  })

  it('rejects addresses over 255 characters', () => {
    const long = `${'a'.repeat(250)}@example.com`
    expect(isValidEmail(long)).toBe(false)
  })

  it('rejects header injection via CR/LF', () => {
    expect(isValidEmail('hello@example.com\r\nBcc: evil@example.com')).toBe(false)
    expect(isValidEmail('hello@example.com\n')).toBe(false)
  })
})

describe('isValidPhone', () => {
  it('accepts a 7+ digit number', () => {
    expect(isValidPhone('5551234')).toBe(true)
  })

  it('accepts a formatted number with dashes and spaces', () => {
    expect(isValidPhone('(555) 123-4567')).toBe(true)
  })

  it('accepts an international number with a leading +', () => {
    expect(isValidPhone('+15551234567')).toBe(true)
  })

  it('rejects a too-short number', () => {
    expect(isValidPhone('12345')).toBe(false)
  })

  it('rejects a number with too many digits', () => {
    expect(isValidPhone('1234567890123456')).toBe(false)
  })

  it('rejects letters mixed into the number', () => {
    expect(isValidPhone('555-CALL-NOW')).toBe(false)
  })

  it('rejects an empty or whitespace-only string', () => {
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone('   ')).toBe(false)
  })

  it('rejects non-string values', () => {
    expect(isValidPhone(5551234567)).toBe(false)
  })
})

describe('isValidSessionDate', () => {
  function dateOffsetFromToday(days: number): string {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  }

  it('accepts a date within the lead time and booking window', () => {
    const date = dateOffsetFromToday(10)
    expect(isValidSessionDate(date)).toBe(true)
  })

  it('rejects a date before the minimum lead time', () => {
    const date = dateOffsetFromToday(1)
    expect(isValidSessionDate(date)).toBe(false)
  })

  it('rejects a date beyond the max booking window', () => {
    const date = dateOffsetFromToday(MAX_BOOKING_MONTHS * 31 + 30)
    expect(isValidSessionDate(date)).toBe(false)
  })

  it('accepts a date on the earliest allowed boundary', () => {
    const days = Math.ceil(MIN_LEAD_TIME_HOURS / 24)
    const date = dateOffsetFromToday(days)
    expect(isValidSessionDate(date)).toBe(true)
  })

  it('accepts a date on the latest allowed boundary', () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setMonth(d.getMonth() + MAX_BOOKING_MONTHS)
    const date = d.toISOString().split('T')[0]
    expect(isValidSessionDate(date)).toBe(true)
  })

  it('rejects an invalid date string', () => {
    expect(isValidSessionDate('not-a-date')).toBe(false)
    expect(isValidSessionDate('2026-13-40')).toBe(false)
  })

  it('rejects non-string values', () => {
    expect(isValidSessionDate(undefined)).toBe(false)
  })

  it('respects custom lead time and booking window overrides', () => {
    const date = dateOffsetFromToday(3)
    expect(isValidSessionDate(date, { minLeadTimeHours: 24, maxBookingMonths: 1 })).toBe(true)
    expect(isValidSessionDate(date, { minLeadTimeHours: 240, maxBookingMonths: 1 })).toBe(false)
  })
})

describe('anyFieldTooLong', () => {
  const limits = { name: 10, message: 20 }

  it('returns false when a field is exactly at the limit', () => {
    expect(anyFieldTooLong({ name: 'a'.repeat(10) }, limits)).toBe(false)
  })

  it('returns true when a field is one character over the limit', () => {
    expect(anyFieldTooLong({ name: 'a'.repeat(11) }, limits)).toBe(true)
  })

  it('returns false when all fields are under their limits', () => {
    expect(anyFieldTooLong({ name: 'short', message: 'also short' }, limits)).toBe(false)
  })

  it('ignores non-string values', () => {
    expect(anyFieldTooLong({ name: 12345 }, limits)).toBe(false)
  })

  it('ignores fields not present in limits', () => {
    expect(anyFieldTooLong({ unrelated: 'a'.repeat(500) }, limits)).toBe(false)
  })
})

describe('escapeHtml', () => {
  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
  })

  it('escapes double and single quotes', () => {
    expect(escapeHtml(`She said "hi" and 'bye'`)).toBe('She said &quot;hi&quot; and &#039;bye&#039;')
  })

  it('passes through a clean string unchanged', () => {
    expect(escapeHtml('Just a normal sentence.')).toBe('Just a normal sentence.')
  })

  it('returns an empty string for non-string values', () => {
    expect(escapeHtml(undefined)).toBe('')
    expect(escapeHtml(42)).toBe('')
  })
})
