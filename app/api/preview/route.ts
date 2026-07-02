import { draftMode, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import payloadConfig from '@payload-config'

// Draft-mode preview entry point (TYN-231). Powers the admin Live Preview pane
// for Blog Posts: it enables Next.js draft mode and redirects to /blog/[slug],
// where the page renders the post regardless of status (so unpublished drafts
// preview without a 404). Gated on a logged-in Payload session rather than a
// shared secret - the preview iframe is same-origin and carries the admin
// cookie, and auth is both simpler and safer than a secret in the URL.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  let user
  try {
    const payload = await getPayload({ config: payloadConfig })
    ;({ user } = await payload.auth({ headers: await headers() }))
  } catch (err) {
    console.error('[preview] auth check failed:', err)
    return new Response('Internal server error', { status: 500 })
  }
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const slug = new URL(request.url).searchParams.get('slug')
  // Only allow a safe slug, and only ever redirect to an internal /blog path.
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return new Response('Invalid or missing slug', { status: 400 })
  }

  const draft = await draftMode()
  draft.enable()
  redirect(`/blog/${slug}`)
}
