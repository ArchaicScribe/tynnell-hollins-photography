// Cloudflare Turnstile check shared by the public forms (contact, email
// signup). TYN-357: it lets everything through while no secret key is set, so
// the forms keep working until a Turnstile widget exists for the domain and
// its keys are in the env vars. Once a key is set, a missing token, a
// rejected token, or an unreachable Cloudflare all fail.
export async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (typeof token !== 'string' || !token) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    })
    const json = (await res.json()) as { success: boolean }
    return json.success === true
  } catch (e) {
    console.error('[turnstile] verification request failed:', e)
    return false
  }
}
