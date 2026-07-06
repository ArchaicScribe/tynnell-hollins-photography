import { NextResponse } from 'next/server'
import { requireBuilderUser } from '@/app/lib/builderAuth'
import type { Post } from '@/payload-types'

// Persist edits from the in-context blog editor (/blog-editor/[slug]).
// `publish: true` also sets status to 'published'; otherwise only the
// supplied fields change, so autosave never touches draft/published state.
// Posts.ts's own afterChange hook (revalidatePost) handles revalidation, so
// no manual revalidatePath call is needed here.
export const dynamic = 'force-dynamic'

const ALLOWED_FIELDS = ['title', 'slug', 'excerpt', 'publishedAt', 'coverImage', 'category', 'body'] as const

type Patch = Partial<Pick<Post, (typeof ALLOWED_FIELDS)[number]>>

export async function POST(request: Request) {
  const auth = await requireBuilderUser()
  if (auth instanceof NextResponse) return auth
  const { payload } = auth

  let id: number
  let patch: Patch
  let publish = false
  try {
    const body = await request.json()
    id = Number(body?.id)
    patch = {}
    if (body?.patch && typeof body.patch === 'object') {
      for (const key of ALLOWED_FIELDS) {
        if (key in body.patch) (patch as Record<string, unknown>)[key] = body.patch[key]
      }
    }
    publish = body?.publish === true
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: 'Missing post id' }, { status: 400 })
  }
  if (Object.keys(patch).length === 0 && !publish) {
    return NextResponse.json({ error: 'Nothing to save' }, { status: 400 })
  }

  try {
    const updated = await payload.update({
      collection: 'posts',
      id,
      data: publish ? { ...patch, status: 'published' } : patch,
    })
    return NextResponse.json({ ok: true, slug: updated.slug })
  } catch (err) {
    console.error('[blog-editor/save] failed to save post:', err)
    return NextResponse.json({ error: 'Failed to save post' }, { status: 500 })
  }
}
