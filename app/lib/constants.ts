/**
 * Single source of truth for the studio contact email address and the
 * Resend "from" sender string used in transactional emails.
 *
 * Import these instead of hardcoding the address in components or routes.
 */

export const CONTACT_EMAIL = 'hello@tynnellhollinsphotography.com'

export const EMAIL_FROM = `Tynnell Hollins Photography <${CONTACT_EMAIL}>`

export const RATE_LIMIT_ERROR = 'Too many requests. Please try again later.'

/**
 * The brand renders on two lines in both the navbar and the footer: a large
 * mark and a small tracked subline. Derive that split from the configured
 * business name rather than hardcoding it, so renaming in Site Settings
 * actually changes the site.
 *
 * The heuristic is deliberately conservative: only peel off a trailing
 * descriptor when there are 3+ words ("Tynnell Hollins Photography" becomes
 * "Tynnell Hollins" + "Photography"). A shorter name renders on one line,
 * which is correct rather than a degraded fallback.
 *
 * Lives here rather than in app/lib/siteConfig.ts because the navbar is a
 * client component and siteConfig pulls in payload/@payload-config, which
 * breaks the client bundle. Same split as siteTheme.ts vs siteDesign.ts.
 */
export function splitBrand(title: string): { mark: string; sub: string } {
  const words = title.trim().split(/\s+/)
  if (words.length < 3) return { mark: title.trim(), sub: '' }
  return { mark: words.slice(0, -1).join(' '), sub: words[words.length - 1] }
}
