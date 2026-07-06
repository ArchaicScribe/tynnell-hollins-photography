import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { BlogEditorShell } from './BlogEditorShell'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Blog Editor' }

// List-only landing state (no post selected) - same route shell as
// app/blog-editor/[slug]/page.tsx, just without a post loaded into the canvas.
export default async function BlogEditorPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  return <BlogEditorShell selectedPost={null} />
}
