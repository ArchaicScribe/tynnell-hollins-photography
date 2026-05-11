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
