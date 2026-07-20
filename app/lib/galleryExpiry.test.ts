import { describe, it, expect, vi, afterEach } from 'vitest'
import { isGalleryExpired, daysUntilExpiry } from './galleryExpiry'

afterEach(() => {
  vi.useRealTimers()
})

describe('isGalleryExpired', () => {
  it('returns false when expiresAt is unset', () => {
    expect(isGalleryExpired(null)).toBe(false)
    expect(isGalleryExpired(undefined)).toBe(false)
    expect(isGalleryExpired('')).toBe(false)
  })

  it('returns false when expiresAt is invalid', () => {
    expect(isGalleryExpired('not-a-date')).toBe(false)
  })

  it('returns false for a future date', () => {
    expect(isGalleryExpired('2099-01-01')).toBe(false)
  })

  it('returns true for a clearly past date', () => {
    expect(isGalleryExpired('2020-01-01')).toBe(true)
  })

  it('is NOT expired at any point during the expiry date itself (end-of-day boundary)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T08:00:00Z'))
    expect(isGalleryExpired('2026-07-20')).toBe(false)
  })

  it('IS expired the day after the expiry date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-21T00:00:01Z'))
    expect(isGalleryExpired('2026-07-20')).toBe(true)
  })
})

describe('daysUntilExpiry', () => {
  it('returns null when expiresAt is unset or invalid', () => {
    expect(daysUntilExpiry(null)).toBeNull()
    expect(daysUntilExpiry(undefined)).toBeNull()
    expect(daysUntilExpiry('garbage')).toBeNull()
  })

  it('returns 0 on the expiry day itself', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T12:00:00Z'))
    expect(daysUntilExpiry('2026-07-20')).toBe(0)
  })

  it('returns a positive count for a future date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T00:00:00Z'))
    expect(daysUntilExpiry('2026-07-23')).toBe(3)
  })

  it('returns a negative count for an already-past date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-25T00:00:00Z'))
    expect(daysUntilExpiry('2026-07-20')).toBeLessThan(0)
  })
})
