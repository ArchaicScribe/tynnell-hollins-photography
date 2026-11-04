import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import payloadConfig from '@payload-config'
import type { Data } from '@measured/puck'
import { EditorLoader } from './EditorLoader'

// Visual editor for a single builder page (TYN-216). Auth-gated.
export const dynamic = 'force-dynamic'

const EMPTY: Data = { content: [], root: {} }

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  const page = docs[0]
  if (!page) notFound()

  // Resume from the unpublished draft when there is one, so a saved draft is
  // what the editor reopens, not the older live version.
  const data = ((page.draftContent ?? page.content) as Data | null | undefined) ?? EMPTY

  return (
    <EditorLoader
      slug={slug}
      title={page.title}
      published={Boolean(page.published)}
      hasDraft={page.draftContent != null}
      initialData={data}
      promotedRoute={typeof page.promotedRoute === 'string' ? page.promotedRoute : null}
    />
  )
}
