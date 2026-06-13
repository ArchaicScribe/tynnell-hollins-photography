import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import payloadConfig from '@payload-config'

// Persist a builder page's Puck document (TYN-216 / TYN-232). Auth-gated.
// `publish: true` also marks the page published; otherwise the content is saved
// without changing the published flag, so a draft can be saved and resumed
// without going live. Either way the public route is revalidated.
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let slug: string
  let data: unknown
  let publish = false
  try {
    const body = await request.json()
    slug = body?.slug
    data = body?.data
    publish = body?.publish === true
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'Missing page slug' }, { status: 400 })
  }
  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'Missing builder data' }, { status: 400 })
  }

  const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  const page = docs[0]
  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  await payload.update({
    collection: 'pages',
    id: page.id,
    // Save draft leaves `published` untouched; Publish sets it true.
    data: publish ? { content: data, published: true } : { content: data },
  })

  try {
    revalidatePath(`/${slug}`)
  } catch {
    // No-op outside a request scope.
  }

  return NextResponse.json({ ok: true })
}
