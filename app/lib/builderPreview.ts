import { draftMode } from 'next/headers'
import type { Data } from '@measured/puck'

// TYN-343: "View Page" in the Page Builder only ever showed the live,
// published version - there was no way to see draft/unpublished edits in
// context before hitting Publish. This checks Next.js Draft Mode, which
// /api/builder-preview turns on for an authenticated admin session. Every
// promoted-route page.tsx (and the custom-page catch-all) drops its
// `published: true` filter when preview mode is active, so the one page
// currently claiming that route/slug renders regardless of publish state -
// preventDuplicatePromotion (collections/Pages.ts) already guarantees at
// most one page can claim a given route, so this can't leak a different
// page's draft.
export async function isPreviewMode(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled
  } catch {
    return false
  }
}

const EMPTY: Data = { content: [], root: {} }

// The Puck document a builder page should render for this request. Visitors
// always get `content`, the published version. In Draft Mode the page's
// unpublished `draftContent` wins when there is one, so Preview shows the
// edits that are not live yet.
export async function pageRenderData(page: { content?: unknown; draftContent?: unknown }): Promise<Data> {
  const doc = (await isPreviewMode()) ? (page.draftContent ?? page.content) : page.content
  return (doc as Data | null | undefined) ?? EMPTY
}
