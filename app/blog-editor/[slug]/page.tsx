import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { BlogEditorShell } from '../BlogEditorShell'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return { title: slug }
}

export default async function BlogEditorPostPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  const post = docs[0]
  if (!post) notFound()

  return <BlogEditorShell selectedPost={post} />
}
