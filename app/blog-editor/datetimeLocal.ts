/**
 * Conversions between a stored UTC ISO timestamp and the value of an
 * `<input type="datetime-local">`, which has no timezone and is always read
 * and written as the browser's local wall-clock time.
 *
 * Feeding `iso.slice(0, 16)` straight into the input treats the UTC clock
 * time as local time, so every blur shifted the saved date by the UTC offset
 * (e.g. 4-5 hours per save in US Eastern). These two helpers convert
 * explicitly in both directions so a value round-trips unchanged.
 */

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** UTC ISO timestamp -> "YYYY-MM-DDTHH:mm" in local time, or '' if missing/invalid. */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "YYYY-MM-DDTHH:mm" in local time -> UTC ISO timestamp, or null if empty/invalid. */
export function localInputToIso(value: string): string | null {
  if (!value) return null
  // A date-time string without an offset is parsed as local time per the spec.
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}
