import { NextResponse } from 'next/server'
import { requireBuilderUser } from '@/app/lib/builderAuth'

// Duplicate a builder page (TYN-224). Auth-gated. Creates an unpublished copy
// ("Copy of X") with a fresh unique slug so the original URL is untouched.
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = await requireBuilderUser()
  if (auth instanceof NextResponse) return auth
  const { payload } = auth

  let id: number | string | undefined
  try {
    const body = await request.json()
    id = body?.id
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (id === undefined || id === null || id === '') {
    return NextResponse.json({ error: 'Missing page id' }, { status: 400 })
  }

  const src = await payload.findByID({ collection: 'pages', id, depth: 0 }).catch(() => null)
  if (!src) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  let slug = `${src.slug}-copy`
  const existing = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  if (existing.docs.length > 0) slug = `${slug}-${String(Date.now()).slice(-5)}`

  await payload.create({
    collection: 'pages',
    data: {
      title: `Copy of ${src.title}`,
      slug,
      content: src.content ?? { content: [], root: {} },
      published: false,
      displayOrder: Date.now(),
    },
  })

  return NextResponse.json({ ok: true, slug })
}
