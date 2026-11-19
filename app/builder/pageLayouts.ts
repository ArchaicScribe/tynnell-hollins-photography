import type { Data } from '@measured/puck'
import { buildWedding } from './weddingLayout'
import { buildPortraits } from './portraitsLayout'
import { buildAbout, aboutWordsFromCurrent } from './aboutLayout'
import { buildMyWork, myWorkWordsFromCurrent } from './myWorkLayout'
import { buildContact } from './contactLayout'

// Page address (slug) -> the layout that page is built from. `current` is the
// page's saved content, so a layout that rebuilds an existing page can carry
// its words over (see homeWordsFromCurrent in homeLayout.ts). Pure and free of
// path aliases so scripts/write-page-drafts.ts can run it under tsx.
export const LAYOUTS: Record<string, (current?: unknown) => Data> = {
  'wedding-photography': () => buildWedding(),
  portraits: () => buildPortraits(),
  // The page behind /portfolio ("My work") has the slug portfolio-builder.
  'portfolio-builder': (current) => buildMyWork(myWorkWordsFromCurrent(current)),
  contact: () => buildContact(),
  about: (current) => {
    const { specialties, ...words } = aboutWordsFromCurrent(current)
    return buildAbout(words, specialties)
  },
}

export function layoutForSlug(slug: string, current?: unknown): Data | null {
  const build = Object.prototype.hasOwnProperty.call(LAYOUTS, slug) ? LAYOUTS[slug] : undefined
  return build ? build(current) : null
}

// Guards for scripts/write-page-drafts.ts. Pure so they are tested without a
// database. Neither script mode may ever overwrite a saved draft or a page.
export function assertCanCreate(existingSlugs: string[], slug: string): void {
  if (!layoutForSlug(slug)) throw new Error(`There is no layout for "${slug}"`)
  if (existingSlugs.includes(slug)) throw new Error(`A page "${slug}" already exists; refusing to create it again`)
}

export function assertCanDraft(row: { id: number; slug: string; draft_content: unknown }, dryRun: boolean): void {
  if (!layoutForSlug(row.slug)) throw new Error(`There is no layout for page ${row.id} ("${row.slug}")`)
  // A saved draft is someone's unpublished work, and the builder's Publish
  // button publishes every page's draft at once. Never overwrite one silently.
  if (row.draft_content != null && !dryRun) {
    throw new Error(`Page ${row.id} already has a saved draft; refusing to overwrite it`)
  }
}
