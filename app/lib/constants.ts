/**
 * Shared application constants.
 * Values referenced in more than one file live here so they stay in sync.
 */

/**
 * Public contact email for Tynnell Hollins Photography.
 * Used in email templates, error messages, and the contact page.
 * This is a hardcoded constant, not a secret — it is displayed publicly on the site.
 */
export const CONTACT_EMAIL = 'hello@tynnellhollinsphotography.com'

/**
 * Resend "from" sender identity for all outgoing emails.
 * Must match a verified Resend sending domain.
 */
export const EMAIL_FROM = `Tynnell Hollins Photography <${CONTACT_EMAIL}>`
