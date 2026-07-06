import { NextResponse } from 'next/server'
import { requireBuilderUser } from '@/app/lib/builderAuth'

// Creates a placeholder draft post so the "+ New Post" flow in /blog-editor
// has somewhere to redirect to immediately. Posts.ts's beforeValidate hook
// auto-fills slug from title and publishedAt from now.
export const dynamic = 'force-dynamic'

export async function POST() {
  const auth = await requireBuilderUser()
  if (auth instanceof NextResponse) return auth
  const { payload } = auth

  try {
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'Untitled Post',
        slug: `untitled-${Date.now()}`,
        status: 'draft',
        publishedAt: new Date().toISOString(),
      },
    })
    return NextResponse.json({ slug: post.slug })
  } catch (err) {
    console.error('[blog-editor/create] failed to create post:', err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
