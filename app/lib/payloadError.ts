// Payload's REST API returns validation failures as
// { errors: [{ message, data: { errors: [{ label, message, path }] } }] } -
// confirmed against a live POST /api/galleries response (TYN-312). The
// top-level message is a readable summary ("The following field is invalid:
// Category"); the nested per-field messages are more specific when several
// fields fail at once. Used anywhere a raw Payload collection route (not one
// of this app's own /api/* wrappers, which already return { error: string })
// is called directly from client code, so a validation failure is never a
// silent, unexplained "please try again."
export function extractPayloadErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback
  const errors = (body as { errors?: unknown }).errors
  if (!Array.isArray(errors) || errors.length === 0) return fallback

  const first = errors[0] as { message?: unknown; data?: { errors?: unknown } }
  const fieldErrors = first.data?.errors
  if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
    const detail = fieldErrors
      .map((e) => {
        const fe = e as { label?: unknown; message?: unknown }
        if (typeof fe.label === 'string' && typeof fe.message === 'string') return `${fe.label}: ${fe.message}`
        return typeof fe.message === 'string' ? fe.message : null
      })
      .filter((s): s is string => s !== null)
      .join(', ')
    if (detail) return detail
  }

  return typeof first.message === 'string' ? first.message : fallback
}
