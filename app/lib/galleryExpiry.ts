/**
 * A gallery's expiresAt is a date-only value (midnight of the chosen day).
 * Treated as "end of that day" everywhere it's checked, so a gallery set to
 * expire on a given date stays available through the entirety of that date
 * rather than dying at 12:00am - "available through July 20" not "until
 * July 19 at midnight".
 */

// A date-only string ("2026-07-20") parses as UTC midnight per the ISO 8601
// spec, so end-of-day must be computed in UTC too - using local setHours()
// here would make expiry depend on the server/test machine's timezone.
function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr)
  d.setUTCHours(23, 59, 59, 999)
  return d
}

export function isGalleryExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false
  const expiry = endOfDay(expiresAt)
  if (isNaN(expiry.getTime())) return false
  return Date.now() > expiry.getTime()
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * Whole calendar days between today and expiresAt (0 on the expiry date
 * itself, regardless of time of day; negative once expiresAt has passed).
 * Distinct from isGalleryExpired's precise end-of-day boundary check - this
 * is a day-granularity count for the "remind N days before" cron window.
 * Returns null if expiresAt is unset or invalid.
 */
export function daysUntilExpiry(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null
  const expiry = new Date(expiresAt)
  if (isNaN(expiry.getTime())) return null

  const todayMidnight = new Date()
  todayMidnight.setUTCHours(0, 0, 0, 0)
  const expiryMidnight = new Date(expiry)
  expiryMidnight.setUTCHours(0, 0, 0, 0)

  return Math.round((expiryMidnight.getTime() - todayMidnight.getTime()) / MS_PER_DAY)
}
