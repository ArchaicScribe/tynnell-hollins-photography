// Links Tynnell types into Site Settings end up on every public page (menu
// cards) or in emails to subscribers (the freebie), so this decides what
// counts as a link: a page on this site ("/contact", but not the
// protocol-relative "//host") or a secure link elsewhere. Rules out
// javascript:, data:, plain http and bare words that a browser would resolve
// against the current page.
export function isSafeLink(value: string): boolean {
  if (value.startsWith('/')) return !value.startsWith('//')
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}
