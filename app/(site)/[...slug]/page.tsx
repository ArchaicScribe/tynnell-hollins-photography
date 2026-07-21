import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import { Render, resolveAllData } from '@measured/puck/rsc'
import type { Data } from '@measured/puck'
import payloadConfig from '@payload-config'
import { config as puckConfig } from '@/app/builder/puck.config'

// Public render of a builder page (TYN-216). This catch-all only handles slugs
// NOT already owned by an explicit route (/, /about, /portfolio, ...): Next.js
// route precedence gives static and specific dynamic routes priority over this
// catch-all, so existing pages are never shadowed. Unknown/unpublished slugs
// fall through to notFound().
//
// ISR instead of force-dynamic (TYN-290): this page has no cookie/session
// logic, unlike the gallery pages. The builder's save/delete/rename routes
// call revalidatePath for the affected slug, so edits go live immediately;
// the 120s window (matching the homepage's ISR interval) is just a backstop.
export const revalidate = 120

// cache() dedupes the lookup across generateMetadata + the page body within a
// single request render, so a published-page view hits the DB once, not twice.
const findPublishedPage = cache(async (path: string) => {
  const payload = await getPayload({ config: payloadConfig })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ slug: { equals: path } }, { published: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
})

// Give each published page its own browser-tab + search title (TYN-231). The
// (site) layout's title template appends " | Tynnell Hollins Photography".
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params
  const page = await findPublishedPage(slug.join('/'))
  if (!page) return {}
  return { title: page.title }
}

export default async function BuilderPublicPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const page = await findPublishedPage(slug.join('/'))
  if (!page) notFound()

  const data = (page.content as Data | undefined) ?? { content: [], root: {} }
  // See app/(site)/page.tsx's comment on resolveAllData - same reasoning here.
  return <Render config={puckConfig} data={await resolveAllData(data, puckConfig)} />
}
