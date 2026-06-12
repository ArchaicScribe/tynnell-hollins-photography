import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import payloadConfig from '@payload-config'

// Rename a builder page's display title (TYN-223). Auth-gated. The slug is
// intentionally left unchanged so the published URL stays stable.
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let id: number | string | undefined
  let title: unknown
  try {
    const body = await request.json()
    id = body?.id
    title = body?.title
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (id === undefined || id === null || id === '') {
    return NextResponse.json({ error: 'Missing page id' }, { status: 400 })
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  await payload.update({ collection: 'pages', id, data: { title: title.trim() } })
  return NextResponse.json({ ok: true })
}
