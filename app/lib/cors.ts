/**
 * CSRF / origin protection for API routes.
 *
 * Browsers automatically send an Origin header on cross-origin requests.
 * By only accepting requests whose Origin is on this allowlist, we block
 * cross-site requests that a third-party page could trigger on behalf of
 * a visitor's browser.
 *
 * Same-origin fetch calls (from our own Next.js frontend) always pass
 * because the browser sets Origin to the same domain.
 */
const ALLOWED_ORIGINS = [
  'https://tynnellhollinsphotography.com',
  'https://www.tynnellhollinsphotography.com',
  process.env.NEXT_PUBLIC_SITE_URL,
  ...(process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:3001']
    : []),
].filter(Boolean) as string[]

/**
 * Returns true if the request's Origin header is on the allowlist.
 * Returns false (and should be responded to with 403) if missing or disallowed.
 */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  return Boolean(origin && ALLOWED_ORIGINS.includes(origin))
}
