import { NextRequest, NextResponse } from 'next/server'
import { setFavorite } from '@/app/lib/favorites'
import { currentList, favoritesBody, noList, openFavoritesGallery, withListLock } from '@/app/lib/favoritesRequest'

// POST /api/favorites/toggle { gallery, photoId, favorited }: heart or
// un-heart one photo (TYN-13). `favorited` is the wanted end state, so a
// retried request is harmless.
export async function POST(req: NextRequest) {
  let body: { gallery?: unknown; photoId?: unknown; favorited?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { photoId, favorited } = body
  if (typeof photoId !== 'number' || !Number.isInteger(photoId) || typeof favorited !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const ctx = await openFavoritesGallery(body.gallery)
  if (ctx instanceof NextResponse) return ctx
  const cookieList = await currentList(ctx)
  if (!cookieList) return noList()

  const limit = ctx.gallery.favoritesLimit || null
  // The list is read again inside the lock: the copy above may already be
  // out of date if another device on the same list is hearting right now.
  return withListLock(ctx.payload, cookieList.id, async req => {
    const list = await ctx.payload.findByID({ collection: 'favorite-lists', id: cookieList.id, depth: 0, req })
    const result = setFavorite(list.photoIds, photoId, favorited, { galleryPhotoIds: ctx.galleryPhotoIds, limit })
    if (!result.ok) {
      return result.reason === 'limit_reached'
        ? NextResponse.json({ error: `You can choose up to ${limit} favorites. Remove one to add another.` }, { status: 409 })
        : NextResponse.json({ error: 'That photo is not in this gallery' }, { status: 400 })
    }

    const updated = await ctx.payload.update({
      collection: 'favorite-lists',
      id: list.id,
      data: { photoIds: result.photoIds },
      depth: 0,
      req,
    })
    return NextResponse.json(favoritesBody(ctx, updated))
  })
}
