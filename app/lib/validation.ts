/**
 * Maximum character lengths for API input fields.
 * Prevents oversized payloads from reaching Resend or Stripe.
 */
export const CONTACT_MAX_LENGTHS = {
  name:              100,
  phone:              20,
  contactPreference:  20,
  sessionType:       100,
  date:               10,
  location:          300,
  message:          5000,
  howHeard:          100,
} as const

export const CHECKOUT_MAX_LENGTHS = {
  packageName: 200,
  clientName:  100,
} as const

export const SHARE_MAX_LENGTHS = {
  clientName: 100,
} as const

/**
 * Returns true if any field in `values` exceeds its limit in `limits`.
 * Only checks string values - non-strings are skipped.
 */
export function anyFieldTooLong(
  values: Record<string, unknown>,
  limits: Record<string, number>,
): boolean {
  return Object.entries(limits).some(([key, max]) => {
    const val = values[key]
    return typeof val === 'string' && val.length > max
  })
}

/**
 * Validates a phone number submitted via the contact form.
 *
 * Strips all non-digit characters, then checks that the result has
 * between 7 and 15 digits (covers local US numbers through E.164 international).
 * Leading + for country codes is intentionally allowed before stripping.
 */
export function isValidPhone(phone: unknown): boolean {
  if (typeof phone !== 'string') return false
  if (phone.trim().length === 0) return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

/**
 * Validates an email address for use in API routes.
 *
 * Rejects:
 * - Non-string values
 * - Addresses longer than 255 characters (RFC 5321 limit)
 * - Any string containing \r or \n (blocks email header injection)
 * - Strings that don't match basic address format
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false
  if (email.length > 255) return false
  if (/[\r\n]/.test(email)) return false
  return EMAIL_REGEX.test(email)
}

export const MIN_LEAD_TIME_HOURS = 48
export const MAX_BOOKING_MONTHS = 24

/**
 * Computes the min/max date strings (YYYY-MM-DD) for the contact form's
 * session-date picker. Shared by app/(site)/contact/page.tsx and the
 * builder's ContactFormBlock (app/builder/puck.config.tsx, via
 * /api/public-booking-dates) so both compute the same bounds the same way.
 */
export function computeBookingDateBounds(options?: { minLeadTimeHours?: number; maxBookingMonths?: number }): { minDate: string; maxDate: string } {
  const minLeadHours = options?.minLeadTimeHours ?? MIN_LEAD_TIME_HOURS
  const maxMonths = options?.maxBookingMonths ?? MAX_BOOKING_MONTHS

  const minD = new Date()
  minD.setTime(minD.getTime() + minLeadHours * 60 * 60 * 1000)
  const maxD = new Date()
  maxD.setMonth(maxD.getMonth() + maxMonths)

  return { minDate: minD.toISOString().split('T')[0], maxDate: maxD.toISOString().split('T')[0] }
}

/**
 * Validates a session date string submitted via the contact form.
 *
 * Accepts optional overrides for lead time and booking window - used when
 * the contact API route fetches live values from the BookingSettings global.
 * Falls back to the hardcoded constants if overrides are not provided.
 */
export function isValidSessionDate(
  dateStr: unknown,
  options?: { minLeadTimeHours?: number; maxBookingMonths?: number },
): boolean {
  if (typeof dateStr !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false

  const [year, month, day] = dateStr.split('-').map(Number)
  const submitted = new Date(year, month - 1, day)
  if (isNaN(submitted.getTime())) return false
  // The Date constructor silently rolls over out-of-range components (month 13,
  // day 40) into a different valid date instead of failing - reject anything
  // that doesn't round-trip back to the exact input.
  if (submitted.getFullYear() !== year || submitted.getMonth() !== month - 1 || submitted.getDate() !== day) {
    return false
  }

  const leadTimeHours = options?.minLeadTimeHours ?? MIN_LEAD_TIME_HOURS
  const bookingMonths = options?.maxBookingMonths ?? MAX_BOOKING_MONTHS

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const earliest = new Date(today)
  earliest.setDate(earliest.getDate() + Math.ceil(leadTimeHours / 24))

  const latest = new Date(today)
  latest.setMonth(latest.getMonth() + bookingMonths)

  return submitted >= earliest && submitted <= latest
}

/**
 * Escapes user-supplied strings before embedding them in HTML email templates.
 * Prevents HTML injection attacks where an attacker crafts input containing
 * tags, scripts, or malicious links that render inside the email.
 */
export function escapeHtml(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
