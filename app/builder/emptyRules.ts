// "Is this block empty?" rules for the hide-until-filled switch. Pure, so each
// rule is tested without rendering. A block with the switch ON and an empty
// result here renders nothing for visitors (see GateEmpty). A lone heading with
// nothing under it counts as empty, except where the heading is the content.

export function isBlank(v: unknown): boolean {
  return typeof v !== 'string' || v.trim() === ''
}

export function statementIsEmpty(p: { lead?: string; text?: string; closing?: string }): boolean {
  return isBlank(p.lead) && isBlank(p.text) && isBlank(p.closing)
}

export function pathChoiceIsEmpty(p: { cards?: { label?: string; href?: string }[] }): boolean {
  return !(p.cards ?? []).some((c) => !isBlank(c?.label) && !isBlank(c?.href))
}

export function statsIsEmpty(p: { items?: { value?: string }[] }): boolean {
  return !(p.items ?? []).some((i) => !isBlank(i?.value))
}

export function splitIsEmpty(p: { body?: string; buttonText?: string }): boolean {
  return isBlank(p.body) && isBlank(p.buttonText)
}

export function ctaIsEmpty(p: { heading?: string }): boolean {
  return isBlank(p.heading)
}

export function albumsIsEmpty(albums: unknown[] | undefined): boolean {
  return !albums || albums.length === 0
}

export function testimonialsIsEmpty(list: unknown[] | undefined): boolean {
  return !list || list.length === 0
}

// A freebie sign-up with words but no guide link would take an address and
// send nothing, so it is empty until the server says the link is set.
export function signupIsEmpty(
  p: { kind?: string; heading?: string; body?: string },
  freebieReady: boolean | undefined,
): boolean {
  if (isBlank(p.heading) && isBlank(p.body)) return true
  if (p.kind === 'freebie' && freebieReady !== true) return true
  return false
}

// Newline-separated text (one list item per line) as a clean list.
export function linesOf(text?: string): string[] {
  if (typeof text !== 'string') return []
  return text.split('\n').map((l) => l.trim()).filter((l) => l !== '')
}

// A package card needs a name and a price line to be worth showing.
export function packagesIsEmpty(p: { cards?: { name?: string; price?: string }[] }): boolean {
  return !(p.cards ?? []).some((c) => !isBlank(c?.name) && !isBlank(c?.price))
}

export function stepsIsEmpty(p: { steps?: { title?: string }[] }): boolean {
  return !(p.steps ?? []).some((s) => !isBlank(s?.title))
}

export function columnsIsEmpty(p: { columns?: { title?: string; lines?: string }[] }): boolean {
  return !(p.columns ?? []).some((c) => !isBlank(c?.title) && linesOf(c?.lines).length > 0)
}

export function faqIsEmpty(p: { items?: { title?: string; body?: string }[] }): boolean {
  return !(p.items ?? []).some((i) => !isBlank(i?.title) && !isBlank(i?.body))
}
