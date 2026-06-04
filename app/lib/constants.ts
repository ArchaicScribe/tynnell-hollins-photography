/**
 * Single source of truth for the studio contact email address and the
 * Resend "from" sender string used in transactional emails.
 *
 * Import these instead of hardcoding the address in components or routes.
 */

export const CONTACT_EMAIL = 'hello@tynnellhollinsphotography.com'

export const EMAIL_FROM = `Tynnell Hollins Photography <${CONTACT_EMAIL}>`
