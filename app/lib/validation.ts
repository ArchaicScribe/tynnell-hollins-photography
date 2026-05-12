import { CONTACT_EMAIL } from '@/app/lib/constants'

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

/**
 * Returns true if any field in `values` exceeds its limit in `limits`.
 * Only checks string values — non-strings are skipped.
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

/**
 * Validates a session date string submitted via the contact form.
 *
 * Rules:
 * - Must be a parseable date in YYYY-MM-DD format
 * - Must be at least MIN_LEAD_TIME_HOURS from now (default: 48h)
 * - Must be no more than MAX_BOOKING_MONTHS in the future (default: 24 months)
 *
 * These constants will be replaced with Sanity-fetched values in TYN-92.
 */
export const MIN_LEAD_TIME_HOURS = 48
export const MAX_BOOKING_MONTHS = 24

/**
 * Returns the user-facing error message for an invalid session date.
 * Derived from MIN_LEAD_TIME_HOURS and MAX_BOOKING_MONTHS so the copy
 * stays in sync automatically when the constants change (TYN-92).
 */
export function sessionDateErrorMessage(): string {
  const minDays  = Math.ceil(MIN_LEAD_TIME_HOURS / 24)
  const maxYears = MAX_BOOKING_MONTHS / 12
  const daysStr  = minDays  === 1 ? '1 day'  : `${minDays} days`
  const yearsStr = maxYears === 1 ? '1 year' : `${maxYears} years`
  return `Please select a date at least ${daysStr} from today. For sessions more than ${yearsStr} out, reach out directly at ${CONTACT_EMAIL}.`
}

export function isValidSessionDate(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string') return false
  // Must match YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false

  // Parse as local calendar date (not UTC) to avoid timezone shifting
  const [year, month, day] = dateStr.split('-').map(Number)
  const submitted = new Date(year, month - 1, day)
  if (isNaN(submitted.getTime())) return false

  // Compare against calendar days, not exact timestamps:
  // "48 hours minimum" = submitted date must be at least 2 full days from today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const earliest = new Date(today)
  earliest.setDate(earliest.getDate() + Math.ceil(MIN_LEAD_TIME_HOURS / 24))

  const latest = new Date(today)
  latest.setMonth(latest.getMonth() + MAX_BOOKING_MONTHS)

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
