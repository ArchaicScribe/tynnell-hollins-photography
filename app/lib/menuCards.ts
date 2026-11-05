// "Work with me" cards in the full-screen menu (Rising Roots gap 4). Edited
// in Site Settings, stored on the SiteConfig global, shown on every page.
//
// Every card's link is rendered on every public page, so the rules for what
// counts as a link live here, in one place, and run both when Site Settings
// saves and when the site reads the cards back.
export type MenuCard = { title: string; linkLabel: string; href: string; imageUrl: string }

export const MAX_MENU_CARDS = 2
export const DEFAULT_MENU_CARD_LINK_LABEL = 'Get the details'

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

// A page on this site ("/contact", but not the protocol-relative "//host")
// or a secure link elsewhere. Rules out javascript:, data:, plain http and
// bare words that the browser would resolve against the current page.
export function isSafeLink(value: string): boolean {
  if (value.startsWith('/')) return !value.startsWith('//')
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function cleanMenuCards(input: unknown): MenuCard[] {
  if (!Array.isArray(input)) return []

  const cards: MenuCard[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const title = text(row.title)
    const href = text(row.href)
    if (!title || !href || !isSafeLink(href)) continue

    const imageUrl = text(row.imageUrl)
    cards.push({
      title,
      linkLabel: text(row.linkLabel) || DEFAULT_MENU_CARD_LINK_LABEL,
      href,
      imageUrl: imageUrl && isSafeLink(imageUrl) ? imageUrl : '',
    })
    if (cards.length === MAX_MENU_CARDS) break
  }
  return cards
}
