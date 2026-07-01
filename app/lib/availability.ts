/**
 * Shared helpers for OOO / blocked availability detection.
 * Used by the contact API route, Stripe webhook, and contact page.
 */

export interface BlockedRange {
  internalLabel?: string | null
  startDate?: string | null
  endDate?: string | null
  applyReturnBuffer?: boolean | null
  returnBufferDays?: number | null
  customerMessage?: string | null
}

export interface ActiveOoo {
  returnDate: Date
  /** customerMessage with {returnDate} placeholder resolved */
  message: string
}

/**
 * Parses a "YYYY-MM-DD" date string as local midnight, not UTC midnight.
 * `new Date(dateOnlyString)` parses date-only strings as UTC per the ISO 8601
 * spec, which silently shifts the calendar day by one in any timezone behind
 * UTC (every US timezone). Date-only strings from Payload date fields always
 * mean "this calendar day" in the studio's local timezone, so they must be
 * parsed as local, matching how submitted booking dates are constructed.
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function computeReturnDate(range: BlockedRange): Date {
  const end = parseLocalDate(range.endDate!)
  const bufferDays = range.applyReturnBuffer !== false ? (range.returnBufferDays ?? 2) : 0
  if (bufferDays > 0) end.setDate(end.getDate() + bufferDays)
  end.setHours(23, 59, 59, 999)
  return end
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * Returns the active OOO entry (and resolved message) if today falls within
 * any blocked range, or null if Tynnell is currently available.
 */
export function getActiveOoo(ranges: BlockedRange[]): ActiveOoo | null {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  for (const range of ranges) {
    if (!range.startDate || !range.endDate) continue

    const start = parseLocalDate(range.startDate)
    const returnDate = computeReturnDate(range)

    if (now >= start && now <= returnDate) {
      const returnDateStr = formatDate(returnDate)
      const message = (
        range.customerMessage ??
        `I am currently away and will be back accepting inquiries on ${returnDateStr}.`
      ).replace('{returnDate}', returnDateStr)

      return { returnDate, message }
    }
  }

  return null
}

export interface BlockedDateResult {
  blocked: true
  message: string
}

/**
 * Checks if a specific date (YYYY-MM-DD string) falls within any blocked range.
 * Used by the contact API route to validate the submitted session date.
 * Returns the resolved customer message if blocked, or null if available.
 */
export function getBlockedDateResult(
  dateStr: string,
  ranges: BlockedRange[],
): BlockedDateResult | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null

  const submitted = parseLocalDate(dateStr)

  const now = new Date()

  for (const range of ranges) {
    if (!range.startDate || !range.endDate) continue

    const start = parseLocalDate(range.startDate)
    const returnDate = computeReturnDate(range)

    if (returnDate < now) continue

    if (submitted >= start && submitted <= returnDate) {
      const returnDateStr = formatDate(returnDate)
      const message = (
        range.customerMessage ??
        'That date is not currently available. Please select a different date or reach out directly.'
      ).replace('{returnDate}', returnDateStr)

      return { blocked: true, message }
    }
  }

  return null
}
