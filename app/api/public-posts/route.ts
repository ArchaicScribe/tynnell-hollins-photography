import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'

// Public, read-only published-post listing for the builder's LiveBlog block
// (app/builder/puck.config.tsx). Deliberately NOT Payload's auto-generated
// `/api/posts` REST route - that requires auth. Runs the same local-API
// query the hardcoded /blog page already uses (published only, sort by
// -publishedAt) and returns exactly the shape BlogClient.tsx expects, so the
// same component renders both the hardcoded page and the promoted block.
const CAT_ORDER = ['style-guide', 'portrait-sessions', 'weddings', 'behind-the-lens', 'client-education']

export async function GET() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    depth: 1,
    limit: 200,
  })

  const posts = docs.map((p) => {
    const coverImage = typeof p.coverImage === 'object' && p.coverImage !== null ? p.coverImage as Photo : null
    return {
      id: p.id,
      title: p.title,
      slug: typeof p.slug === 'string' ? p.slug : '',
      publishedAt: p.publishedAt ?? null,
      category: p.category ?? null,
      excerpt: p.excerpt ?? null,
      coverImage,
    }
  })

  const categories = CAT_ORDER.filter((c) => posts.some((p) => p.category === c))

  return NextResponse.json({ posts, categories })
}
