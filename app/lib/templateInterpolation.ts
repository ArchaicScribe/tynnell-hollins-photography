/**
 * Interpolates {{token}} placeholders in CMS-authored email template text
 * (Settings > Email Templates) with dynamic values at send time.
 *
 * The template text itself is trusted (only an admin can edit it via
 * /site-settings). Only the substituted variable *values* (client name,
 * gallery title, etc.) are untrusted and must be escaped.
 */

import { escapeHtml } from './validation'

const TOKEN_PATTERN = /\{\{(\w+)\}\}/g

function substitute(template: string, vars: Record<string, string>, escape: (v: string) => string): string {
  return template.replace(TOKEN_PATTERN, (match, key: string) => {
    if (!(key in vars)) return match
    return escape(vars[key])
  })
}

// Strips CR/LF from a substituted value so it can't inject extra header
// lines into a Resend subject (or any other single-line context).
function stripLineBreaks(value: string): string {
  return value.replace(/[\r\n]+/g, ' ')
}

/**
 * For multi-line template bodies rendered as HTML. Escapes each variable's
 * value, substitutes it into the (trusted) template text, then converts any
 * remaining newlines in the result to <br /> so line breaks Tynnell typed
 * into a textarea actually show up in the rendered email.
 */
export function interpolateHtml(template: string, vars: Record<string, string>): string {
  const substituted = substitute(template, vars, escapeHtml)
  return substituted.replace(/\r\n|\r|\n/g, '<br />')
}

/**
 * For single-line contexts (the Resend subject line). Does not HTML-escape
 * (a subject line isn't HTML), but strips line breaks from substituted
 * values to prevent header injection.
 */
export function interpolateText(template: string, vars: Record<string, string>): string {
  return substitute(template, vars, stripLineBreaks)
}
