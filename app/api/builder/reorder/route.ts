import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import payloadConfig from '@payload-config'

// Reorder a builder page in the list (TYN-225). Auth-gated. Swaps the page's
// displayOrder with its neighbour in the current sort. Admin-list only - has no
// effect on the public site.
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  return NextResponse.json({ ok: true })
}
