import { NextResponse } from 'next/server'
import { draftMode, headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

// TYN-343: "View Page" in the Page Builder only ever showed the live,
// published version. This enables Next.js Draft Mode for an authenticated
// admin session, then redirects to wherever this page actually renders
// (its own slug, or the real route it's promoted to / isHomepage) - every
// promoted-page lookup (see app/lib/builderPreview.ts) drops its
// `published: true` filter while draft mode is active, so the page's
// current saved content renders there regardless of publish state.
export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  const page = docs[0]
  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  const targetPath = page.isHomepage ? '/' : page.promotedRoute ? `/${page.promotedRoute}` : `/${page.slug}`

  const dm = await draftMode()
  dm.enable()

  return NextResponse.redirect(new URL(targetPath, request.url))
}
