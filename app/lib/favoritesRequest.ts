import { NextResponse } from 'next/server'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import type { FavoriteList, Gallery, Photo } from '@/payload-types'
import { isGalleryExpired } from '@/app/lib/galleryExpiry'
import { favCookieName, listStatus, readFavCookie, signFavCookie } from '@/app/lib/favorites'

// Server side of client favorites (TYN-13), shared by the /api/favorites
// routes. Every route starts with openFavoritesGallery, so a client can only
// act on a gallery they could open in the browser: published, not expired,
// favorites turned on, and (when protected) the password already entered.

const SLUG_RE = /^[a-z0-9-]{1,100}$/
const SIX_MONTHS = 60 * 60 * 24 * 180

export function isGallerySlug(slug: unknown): slug is string {
  return typeof slug === 'string' && SLUG_RE.test(slug)
}

export type FavoritesContext = {
  payload: Payload
  slug: string
  gallery: Gallery
  // The gallery's photos in gallery order. Bare ids when read at depth 0.
  photos: (Photo | number)[]
  galleryPhotoIds: number[]
}

function fail(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

// Same token the password gate issues (app/api/gallery-auth/route.ts).
function passwordEntered(slug: string, passwordHash: string, token: string | undefined): boolean {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret || !token) return false
  const expected = createHmac('sha256', secret).update(`${slug}:${passwordHash}`).digest('hex')
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function openFavoritesGallery(slug: unknown, depth = 0): Promise<FavoritesContext | NextResponse> {
  if (!isGallerySlug(slug)) return fail('Gallery not found', 404)

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'galleries',
    where: { slug: { equals: slug } },
    depth,
    limit: 1,
  })
  const gallery = docs[0] as Gallery | undefined
  if (!gallery || gallery.status === 'draft') return fail('Gallery not found', 404)
  if (isGalleryExpired(gallery.expiresAt)) return fail('This gallery has expired', 403)

  if (gallery.isPasswordProtected && gallery.password) {
    const token = (await cookies()).get(`gauth_${slug}`)?.value
    if (!passwordEntered(slug, gallery.password, token)) return fail('Unauthorized', 401)
  }
  // Checked after the password, so a locked gallery gives nothing away.
  if (!gallery.favoritesEnabled) return fail('Favorites are not available for this gallery', 403)

  const photos = (gallery.photos ?? [])
    .map(row => row.photo)
    .filter((p): p is Photo | number => typeof p === 'number' || (typeof p === 'object' && p !== null))
  const galleryPhotoIds = photos.map(p => (typeof p === 'number' ? p : p.id))

  return { payload, slug, gallery, photos, galleryPhotoIds }
}

// The list this browser's cookie points at, or null. The cookie is signed
// for this gallery's slug; the gallery check below also covers a slug that
// was later reused by a different gallery.
export async function currentList(ctx: FavoritesContext): Promise<FavoriteList | null> {
  const listId = readFavCookie(ctx.slug, (await cookies()).get(favCookieName(ctx.slug))?.value)
  if (listId === null) return null
  try {
    const list = await ctx.payload.findByID({ collection: 'favorite-lists', id: listId, depth: 0 })
    const galleryId = typeof list?.gallery === 'object' && list.gallery !== null ? list.gallery.id : list?.gallery
    return list && galleryId === ctx.gallery.id ? list : null
  } catch {
    return null
  }
}

export function noList(): NextResponse {
  return fail('Enter your name and email to start choosing favorites', 401)
}

export type ClientFavorites = {
  name: string
  email: string
  photoIds: number[]
  sentAt: string | null
  // True when there is something to send that Tynnell has not been sent yet.
  unsentChanges: boolean
}

// What the gallery page is told about a list. Never includes the list id.
export function favoritesBody(ctx: FavoritesContext, list: FavoriteList | null) {
  const limit = ctx.gallery.favoritesLimit || null
  if (!list) return { list: null, limit }
  const client: ClientFavorites = {
    name: list.clientName ?? '',
    email: list.clientEmail,
    ...listStatus(list, ctx.galleryPhotoIds),
  }
  return { list: client, limit }
}

export function rememberList(res: NextResponse, slug: string, listId: number): NextResponse {
  // Path `/` because the cookie is read by /api/favorites/*, not the gallery
  // page. The name is already per-gallery.
  res.cookies.set(favCookieName(slug), signFavCookie(slug, listId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SIX_MONTHS,
  })
  return res
}

export function forgetList(res: NextResponse, slug: string): NextResponse {
  res.cookies.set(favCookieName(slug), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return res
}

// ---------------------------------------------------------------------------
// One writer at a time per list.
//
// A heart is a read-modify-write of the list's photo ids, and the same list
// can be open on two devices (a couple sharing one email), so two hearts
// pressed together would otherwise each save their own copy and one would be
// lost. `fn` runs inside a transaction that first takes a Postgres advisory
// lock keyed on the list; a second request for the same list waits there
// until the first commits. Pass `fn`'s `req` to every Payload call in it, so
// they all run in that transaction.
//
// The lock is transaction-scoped (pg_advisory_xact_lock), which is the only
// kind that works through Neon's pooled connections.
// ---------------------------------------------------------------------------

// Arbitrary, but fixed: the first key of the two-key advisory lock, so list
// ids cannot collide with any other advisory lock taken on this database.
const FAVORITES_LOCK_NAMESPACE = 7713

type LockReq = { transactionID?: string | number }

type TransactionalDb = {
  beginTransaction: () => Promise<string | number | null>
  commitTransaction: (id: string | number) => Promise<void>
  rollbackTransaction: (id: string | number) => Promise<void>
  execute?: (args: { db: unknown; raw: string }) => Promise<unknown>
  sessions?: Record<string, { db: unknown } | undefined>
}

// Opens a transaction holding the list's lock and returns its id, or null if
// the lock could not be taken.
async function takeListLock(db: TransactionalDb, listId: number): Promise<string | number | null> {
  let transactionID: string | number | null = null
  try {
    transactionID = await db.beginTransaction()
    const session = transactionID === null ? undefined : db.sessions?.[transactionID]
    if (!session || !db.execute) throw new Error('database adapter has no transaction session to lock in')
    await db.execute({ db: session.db, raw: `SELECT pg_advisory_xact_lock(${FAVORITES_LOCK_NAMESPACE}, ${Math.trunc(listId)})` })
    return transactionID
  } catch (err) {
    console.error(`[favorites] could not lock list ${listId}, saving without the lock:`, err)
    if (transactionID !== null) await db.rollbackTransaction(transactionID).catch(() => {})
    return null
  }
}

export async function withListLock<T>(payload: Payload, listId: number, fn: (req: LockReq) => Promise<T>): Promise<T> {
  const db = payload.db as unknown as TransactionalDb
  const transactionID = await takeListLock(db, listId)
  // Saving the heart matters more than the lock: without it the only risk is
  // the rare two-devices-at-once overlap. takeListLock has logged why.
  if (transactionID === null) return fn({})

  try {
    const result = await fn({ transactionID })
    await db.commitTransaction(transactionID)
    return result
  } catch (err) {
    await db.rollbackTransaction(transactionID).catch(() => {})
    throw err
  }
}
