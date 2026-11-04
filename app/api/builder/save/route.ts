import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireBuilderUser } from '@/app/lib/builderAuth'

// Persist a builder page's Puck document (TYN-216 / TYN-232). Auth-gated.
// Without `publish`, the document is saved to `draftContent` only: the public
// site keeps rendering `content`, so a draft (or a Preview, which saves first)
// never goes live. `publish: true` copies the document into `content`, clears
// the draft, and marks the page published.
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = await requireBuilderUser()
  if (auth instanceof NextResponse) return auth
  const { payload } = auth

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

  try {
    const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    const page = docs[0]
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    await payload.update({
      collection: 'pages',
      id: page.id,
      data: publish
        ? { content: data, draftContent: null, published: true }
        : { draftContent: data },
    })
  } catch (err) {
    console.error('[builder/save] failed to save page:', err)
    return NextResponse.json({ error: 'Failed to save page' }, { status: 500 })
  }

  // A draft changes nothing visitors see, so only Publish revalidates.
  if (publish) {
    try {
      revalidatePath(`/${slug}`)
    } catch {
      // No-op outside a request scope.
    }
  }

  return NextResponse.json({ ok: true })
}
