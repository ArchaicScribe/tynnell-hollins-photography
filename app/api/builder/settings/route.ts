import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import payloadConfig from '@payload-config'

// Update a builder page's placement flags (TYN-226 / TYN-227). Auth-gated.
// Accepts { id, showInNav?, isHomepage? }. Only the provided flags change.
// Setting isHomepage=true clears it on every other page first so the site
// always has exactly one homepage.
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let id: number | string | undefined
  let showInNav: unknown
  let isHomepage: unknown
  try {
    const body = await request.json()
    id = body?.id
    showInNav = body?.showInNav
    isHomepage = body?.isHomepage
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (id === undefined || id === null || id === '') {
    return NextResponse.json({ error: 'Missing page id' }, { status: 400 })
  }

  const page = await payload.findByID({ collection: 'pages', id, depth: 0 }).catch(() => null)
  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  const data: Record<string, boolean> = {}
  if (typeof showInNav === 'boolean') data.showInNav = showInNav
  if (typeof isHomepage === 'boolean') data.isHomepage = isHomepage
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid flags provided' }, { status: 400 })
  }

  // Enforce a single homepage: clear the flag everywhere else first.
  if (data.isHomepage === true) {
    const others = await payload.find({
      collection: 'pages',
      where: { and: [{ isHomepage: { equals: true } }, { id: { not_equals: id } }] },
      limit: 100,
      depth: 0,
    })
    for (const other of others.docs) {
      await payload.update({ collection: 'pages', id: other.id, data: { isHomepage: false } })
    }
  }

  await payload.update({ collection: 'pages', id, data })

  return NextResponse.json({ ok: true })
}
