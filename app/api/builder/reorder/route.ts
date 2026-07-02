import { NextResponse } from 'next/server'
import { requireBuilderUser } from '@/app/lib/builderAuth'

// Reorder a builder page in the list (TYN-225). Auth-gated. Swaps the page's
// displayOrder with its neighbour in the current sort. Admin-list only - has no
// effect on the public site.
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = await requireBuilderUser()
  if (auth instanceof NextResponse) return auth
  const { payload } = auth

  let id: number | string | undefined
  let direction: unknown
  try {
    const body = await request.json()
    id = body?.id
    direction = body?.direction
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (id === undefined || id === null || (direction !== 'up' && direction !== 'down')) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  try {
    const { docs } = await payload.find({ collection: 'pages', sort: 'displayOrder', limit: 1000, depth: 0 })
    const idx = docs.findIndex((d) => String(d.id) === String(id))
    if (idx === -1) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= docs.length) {
      return NextResponse.json({ ok: true }) // already at the edge
    }

    const a = docs[idx]
    const b = docs[swapIdx]
    const aOrder = typeof a.displayOrder === 'number' ? a.displayOrder : idx
    const bOrder = typeof b.displayOrder === 'number' ? b.displayOrder : swapIdx

    await payload.update({ collection: 'pages', id: a.id, data: { displayOrder: bOrder } })
    await payload.update({ collection: 'pages', id: b.id, data: { displayOrder: aOrder } })
  } catch (err) {
    console.error('[builder/reorder] failed to reorder pages:', err)
    return NextResponse.json({ error: 'Failed to reorder pages' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
