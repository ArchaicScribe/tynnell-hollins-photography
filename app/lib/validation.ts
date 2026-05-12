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
