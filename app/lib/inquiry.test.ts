import { describe, it, expect } from 'vitest'
import { parseInquiryKind, validateKindFields, PORTRAIT_SESSIONS } from './inquiry'
import { CONTACT_MAX_LENGTHS } from './validation'

describe('parseInquiryKind', () => {
  it('treats a missing kind as the old general form', () => {
    expect(parseInquiryKind(undefined)).toBeNull()
    expect(parseInquiryKind(null)).toBeNull()
    expect(parseInquiryKind('')).toBeNull()
  })

  it('accepts the two known kinds', () => {
    expect(parseInquiryKind('wedding')).toBe('wedding')
    expect(parseInquiryKind('portrait')).toBe('portrait')
  })

  it('rejects anything else, including a non-string', () => {
    expect(parseInquiryKind('admin')).toBe('invalid')
    expect(parseInquiryKind('Wedding')).toBe('invalid')
    expect(parseInquiryKind(7)).toBe('invalid')
  })
})

describe('validateKindFields', () => {
  const wedding = { name: 'Ana', email: 'ana@example.com', partnerName: 'Sam', message: 'Hello' }
  const portrait = { name: 'Ana', email: 'ana@example.com', sessionType: 'Maternity', message: 'Hello' }

  it('accepts a wedding with no phone, preference, date or location', () => {
    expect(validateKindFields('wedding', wedding)).toBeNull()
  })

  it('accepts a portrait with each of the four sessions', () => {
    expect(PORTRAIT_SESSIONS).toEqual(['Couple', 'Maternity', 'Newborn', 'Family'])
    for (const sessionType of PORTRAIT_SESSIONS) {
      expect(validateKindFields('portrait', { ...portrait, sessionType })).toBeNull()
    }
  })

  it('requires name, email and message for both kinds, treating whitespace as missing', () => {
    for (const field of ['name', 'email', 'message']) {
      expect(validateKindFields('wedding', { ...wedding, [field]: '   ' })).toEqual(expect.any(String))
      expect(validateKindFields('portrait', { ...portrait, [field]: undefined })).toEqual(expect.any(String))
    }
  })

  it('requires the partner name for a wedding', () => {
    expect(validateKindFields('wedding', { ...wedding, partnerName: '' })).toEqual(expect.any(String))
  })

  it('requires a known session for a portrait', () => {
    expect(validateKindFields('portrait', { ...portrait, sessionType: 'Other' })).toEqual(expect.any(String))
    expect(validateKindFields('portrait', { ...portrait, sessionType: undefined })).toEqual(expect.any(String))
  })

  it('does not accept non-string values as words', () => {
    expect(validateKindFields('wedding', { ...wedding, name: 42 })).toEqual(expect.any(String))
  })
})

describe('contact length limits', () => {
  it('caps the partner name', () => {
    expect(CONTACT_MAX_LENGTHS.partnerName).toBe(100)
  })
})
