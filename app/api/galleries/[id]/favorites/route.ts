import { NextRequest, NextResponse } from 'next/server'
import type { Payload } from 'payload'
import { requireBuilderUser } from '@/app/lib/builderAuth'
import { listStatus } from '@/app/lib/favorites'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

// Studio side of client favorites (TYN-13), used by the gallery editor's
// Favorites tab. Clients never call this: they use /api/favorites/*.

async function galleryPhotoIds(payload: Payload, galleryId: number): Promise<number[] | null> {
  try {
    const gallery = await payload.findByID({ collection: 'galleries', id: galleryId, depth: 0 })
    return (gallery.photos ?? [])
      .map(row => (typeof row.photo === 'object' && row.photo !== null ? row.photo.id : row.photo))
      .filter((id): id is number => typeof id === 'number')
  } catch {
    return null
  }
}

function parseId(value: string | null): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

// GET: every client's favorites list for this gallery, most recently
// changed first.
export async function GET(_req: NextRequest, { params }: Props) {
  const auth = await requireBuilderUser()
  if (auth instanceof NextResponse) return auth
  const { payload } = auth

  const galleryId = parseId((await params).id)
  if (!galleryId) return NextResponse.json({ error: 'Invalid gallery id' }, { status: 400 })
  const photoIds = await galleryPhotoIds(payload, galleryId)
  if (!photoIds) return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })

  const { docs } = await payload.find({
    collection: 'favorite-lists',
    where: { gallery: { equals: galleryId } },
    sort: '-updatedAt',
    depth: 0,
    limit: 200,
  })

  const lists = docs
    .map(list => ({
      id: list.id,
      clientName: list.clientName ?? '',
      clientEmail: list.clientEmail,
      ...listStatus(list, photoIds),
      updatedAt: list.updatedAt,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return NextResponse.json({ lists }, { headers: { 'Cache-Control': 'private, no-store' } })
}

// DELETE ?list=<id>: remove one client's list (a test list, or one made by
// mistake). The client can start a new one with the same email.
export async function DELETE(req: NextRequest, { params }: Props) {
  const auth = await requireBuilderUser()
  if (auth instanceof NextResponse) return auth
  const { payload } = auth

  const galleryId = parseId((await params).id)
  const listId = parseId(req.nextUrl.searchParams.get('list'))
  if (!galleryId || !listId) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  try {
    const list = await payload.findByID({ collection: 'favorite-lists', id: listId, depth: 0 })
    const owner = typeof list.gallery === 'object' && list.gallery !== null ? list.gallery.id : list.gallery
    if (owner !== galleryId) throw new Error('wrong gallery')
  } catch {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }

  await payload.delete({ collection: 'favorite-lists', id: listId })
  return NextResponse.json({ ok: true })
}
