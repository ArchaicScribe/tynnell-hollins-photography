import { NextRequest, NextResponse } from 'next/server'
import { currentList, favoritesBody, forgetList, isGallerySlug, openFavoritesGallery } from '@/app/lib/favoritesRequest'

export const dynamic = 'force-dynamic'

// GET /api/favorites?gallery=<slug>: this browser's favorites list for the
// gallery (TYN-13), or `list: null` if it has not started one.
export async function GET(req: NextRequest) {
  const ctx = await openFavoritesGallery(req.nextUrl.searchParams.get('gallery'))
  if (ctx instanceof NextResponse) return ctx
  return NextResponse.json(favoritesBody(ctx, await currentList(ctx)), {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

// DELETE /api/favorites?gallery=<slug>: "Not you?". Forgets the list on this
// device only. The list itself is kept, and the same email picks it back up.
export async function DELETE(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('gallery')
  if (!isGallerySlug(slug)) return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
  return forgetList(NextResponse.json({ ok: true }), slug)
}
