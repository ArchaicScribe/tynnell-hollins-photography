import { createHmac, timingSafeEqual } from 'crypto'

// TYN-13: client favorites. A client hearts photos in their gallery; the list
// is saved on the site (the `favorite-lists` collection) and tied to their
// browser by a signed cookie, so nothing a browser sends can name another
// client's list.

export function favCookieName(slug: string): string {
  return `fav_${slug}`
}

function signature(slug: string, listId: number): string | null {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) return null
  return createHmac('sha256', secret).update(`fav:${slug}:${listId}`).digest('hex')
}

export function signFavCookie(slug: string, listId: number): string {
  const sig = signature(slug, listId)
  if (!sig) throw new Error('PAYLOAD_SECRET env var is required')
  return `${listId}.${sig}`
}

// The list id this cookie was issued for, or null if it is missing, forged,
// or was issued for another gallery.
export function readFavCookie(slug: string, value: string | undefined): number | null {
  if (!value) return null
  const dot = value.indexOf('.')
  if (dot < 1) return null
  const listId = Number(value.slice(0, dot))
  if (!Number.isInteger(listId) || listId < 1) return null
  const expected = signature(slug, listId)
  if (!expected) return null
  const a = Buffer.from(value.slice(dot + 1))
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b) ? listId : null
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function asIds(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((v): v is number => typeof v === 'number') : []
}

// The saved favorites that can still be shown: a photo Tynnell has since
// taken out of the gallery stays in the saved list but is never surfaced.
export function visibleFavorites(photoIds: unknown, galleryPhotoIds: number[]): number[] {
  const saved = new Set(asIds(photoIds))
  return galleryPhotoIds.filter(id => saved.has(id))
}

type SetFavoriteResult =
  | { ok: true; photoIds: number[] }
  | { ok: false; reason: 'not_in_gallery' | 'limit_reached' }

// `favorited` is the wanted end state rather than a flip, so a retried
// request can never undo itself.
export function setFavorite(
  current: unknown,
  photoId: number,
  favorited: boolean,
  { galleryPhotoIds, limit }: { galleryPhotoIds: number[]; limit: number | null | undefined },
): SetFavoriteResult {
  if (!galleryPhotoIds.includes(photoId)) return { ok: false, reason: 'not_in_gallery' }
  const visible = visibleFavorites(current, galleryPhotoIds)
  if (!favorited) return { ok: true, photoIds: visible.filter(id => id !== photoId) }
  if (visible.includes(photoId)) return { ok: true, photoIds: visible }
  if (limit && visible.length >= limit) return { ok: false, reason: 'limit_reached' }
  return { ok: true, photoIds: [...visible, photoId] }
}

export function changesSinceSent(photoIds: unknown, sentPhotoIds: unknown): { added: number[]; removed: number[] } {
  const now = asIds(photoIds)
  const sent = asIds(sentPhotoIds)
  return {
    added: now.filter(id => !sent.includes(id)),
    removed: sent.filter(id => !now.includes(id)),
  }
}

// What is shown for a saved list, to the client and to Tynnell alike: the
// favorites still in the gallery, and whether there is anything she has not
// been sent yet.
export function listStatus(
  list: { photoIds?: unknown; sentAt?: string | null; sentPhotoIds?: unknown },
  galleryPhotoIds: number[],
): { photoIds: number[]; sentAt: string | null; unsentChanges: boolean } {
  const photoIds = visibleFavorites(list.photoIds, galleryPhotoIds)
  const { added, removed } = changesSinceSent(photoIds, list.sentPhotoIds)
  return {
    photoIds,
    sentAt: list.sentAt ?? null,
    unsentChanges: photoIds.length > 0 && (!list.sentAt || added.length > 0 || removed.length > 0),
  }
}
