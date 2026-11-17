import type { Data } from '@measured/puck'
import { buildWedding } from './weddingLayout'

// Page address (slug) -> the layout that page is built from. `current` is the
// page's saved content, so a layout that rebuilds an existing page can carry
// its words over (see homeWordsFromCurrent in homeLayout.ts). Pure and free of
// path aliases so scripts/write-page-drafts.ts can run it under tsx.
export const LAYOUTS: Record<string, (current?: unknown) => Data> = {
  'wedding-photography': () => buildWedding(),
}

export function layoutForSlug(slug: string, current?: unknown): Data | null {
  const build = Object.prototype.hasOwnProperty.call(LAYOUTS, slug) ? LAYOUTS[slug] : undefined
  return build ? build(current) : null
}
