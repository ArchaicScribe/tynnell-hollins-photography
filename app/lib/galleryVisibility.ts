import type { Payload, Where } from 'payload'
import type { Gallery } from '@/payload-types'
import { isGalleryExpired } from './galleryExpiry'

// The subset of a gallery these checks read. Kept structural so callers can
// pass a full Gallery doc or a lean test fixture.
type GalleryVisibilityFields = Pick<Gallery, 'status' | 'isPasswordProtected' | 'expiresAt'> & {
  photos?: Gallery['photos']
}

/**
 * True when a gallery may be listed or surfaced on the public site without a
 * password: published (not draft), not password protected, and not expired.
 *
 * Deliberately stricter than the gate in portfolio/[slug]/page.tsx, which only
 * prompts for a password when one is actually set. A gallery flagged protected
 * is treated as private for listings even if its password is missing, because
 * the flag is the owner's stated intent.
 */
export function isGalleryPubliclyVisible(gallery: GalleryVisibilityFields): boolean {
  if (gallery.status === 'draft') return false
  if (gallery.isPasswordProtected === true) return false
  if (isGalleryExpired(gallery.expiresAt)) return false
  return true
}

function galleryPhotoIds(gallery: GalleryVisibilityFields): number[] {
  if (!Array.isArray(gallery.photos)) return []
  return gallery.photos
    .map(row => (typeof row.photo === 'number' ? row.photo : row.photo?.id))
    .filter((id): id is number => typeof id === 'number')
}

/**
 * IDs of photos that belong to at least one private (draft, password
 * protected, or expired) gallery and to no publicly visible gallery.
 *
 * A photo that is also in a public gallery is already public on that
 * gallery's page, so it is not withheld from category grids.
 */
export function privateOnlyPhotoIds(galleries: GalleryVisibilityFields[]): number[] {
  const privateIds = new Set<number>()
  const publicIds = new Set<number>()
  for (const gallery of galleries) {
    const target = isGalleryPubliclyVisible(gallery) ? publicIds : privateIds
    for (const id of galleryPhotoIds(gallery)) target.add(id)
  }
  return [...privateIds].filter(id => !publicIds.has(id))
}

/** Loads every gallery and returns privateOnlyPhotoIds for them. */
export async function getPrivateOnlyPhotoIds(payload: Payload): Promise<number[]> {
  const { docs } = await payload.find({
    collection: 'galleries',
    depth: 0,
    limit: 1000,
    pagination: false,
  })
  return privateOnlyPhotoIds(docs as GalleryVisibilityFields[])
}

/** Adds an `id not_in` clause to a photos query, skipping it when empty. */
export function excludePhotoIds(where: Where, ids: number[]): Where {
  if (ids.length === 0) return where
  return { and: [where, { id: { not_in: ids } }] }
}
