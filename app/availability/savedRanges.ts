/**
 * Pulls the saved blocked ranges out of a `PATCH /api/globals/availability`
 * response.
 *
 * Payload's REST global update returns `{ message, result }`, with the updated
 * global under `result`, not the bare document that a GET returns. Reading
 * `blockedRanges` off the top level always found nothing, so the editor reset
 * its list to `[]` after every save, and the next save then deleted every
 * existing range.
 *
 * If the response holds no ranges array at all, the caller's `fallback` (the
 * ranges that were just sent) is returned rather than an empty list, so an
 * unexpected response shape can never wipe the editor's state.
 */
export function extractSavedRanges<T>(response: unknown, fallback: T[]): T[] {
  const body = response as { result?: { blockedRanges?: unknown }; blockedRanges?: unknown } | null
  if (Array.isArray(body?.result?.blockedRanges)) return body.result.blockedRanges as T[]
  if (Array.isArray(body?.blockedRanges)) return body.blockedRanges as T[]
  return fallback
}
