// The shorter wedding and portrait inquiry forms post to /api/contact with a
// `kind`. A request with no kind is the old general contact form, unchanged.

export type InquiryKind = 'wedding' | 'portrait'

export const PORTRAIT_SESSIONS = ['Couple', 'Maternity', 'Newborn', 'Family'] as const

export function parseInquiryKind(v: unknown): InquiryKind | null | 'invalid' {
  if (v === undefined || v === null || v === '') return null
  if (v === 'wedding' || v === 'portrait') return v
  return 'invalid'
}

function has(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== ''
}

// Phone, contact preference, date, location and how-heard are never required.
export function validateKindFields(kind: InquiryKind, body: Record<string, unknown>): string | null {
  if (!has(body.name) || !has(body.email) || !has(body.message)) {
    return 'Please fill in your name, email and a message.'
  }
  if (kind === 'wedding' && !has(body.partnerName)) {
    return "Please tell me your partner's name."
  }
  if (kind === 'portrait' && !(PORTRAIT_SESSIONS as readonly string[]).includes(body.sessionType as string)) {
    return 'Please choose which session you are interested in.'
  }
  return null
}
