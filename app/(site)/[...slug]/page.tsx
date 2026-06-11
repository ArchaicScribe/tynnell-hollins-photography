import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { Render } from '@measured/puck/rsc'
import type { Data } from '@measured/puck'
import payloadConfig from '@payload-config'
import { config as puckConfig } from '@/app/builder/puck.config'

// Public render of a builder page (TYN-216). This catch-all only handles slugs
// NOT already owned by an explicit route (/, /about, /portfolio, ...): Next.js
// route precedence gives static and specific dynamic routes priority over this
// catch-all, so existing pages are never shadowed. Unknown/unpublished slugs
// fall through to notFound().
export const dynamic = 'force-dynamic'

export default async function BuilderPublicPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const path = slug.join('/')

  const payload = await getPayload({ config: payloadConfig })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ slug: { equals: path } }, { published: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  const page = docs[0]
  if (!page) notFound()

  const data = (page.content as Data | undefined) ?? { content: [], root: {} }
  return <Render config={puckConfig} data={data} />
}
