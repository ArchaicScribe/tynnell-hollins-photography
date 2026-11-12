import type { PhotoItem } from './page'

type PhotoDoc = {
  id: number
  url?: string | null
  sizes?: { card?: { url?: string | null } | null; thumbnail?: { url?: string | null } | null } | null
  alt?: string | null
  filename?: string | null
  originalFilename?: string | null
  category?: string | null
}

// One mapping for the three places the editor receives photos (page load,
// library fetch, fresh upload), so none of them forgets a field.
export function photoItemFromDoc(p: PhotoDoc): PhotoItem {
  return {
    id: p.id,
    url: p.sizes?.card?.url ?? p.url ?? null,
    thumbUrl: p.sizes?.thumbnail?.url ?? p.sizes?.card?.url ?? p.url ?? null,
    alt: p.alt ?? null,
    filename: p.filename ?? null,
    originalFilename: p.originalFilename ?? null,
    category: p.category ?? null,
  }
}
