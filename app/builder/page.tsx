import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { SiteEditorClient, type SitePage } from './SiteEditorClient'
import { getSiteDesign } from '@/app/lib/siteDesign'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Studio' }

export default async function BuilderHome({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>
}) {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
  if (!user) redirect('/admin/login')

  const { product } = await searchParams
  const initialProduct = product === 'portfolio' ? 'portfolio' : 'website'

  const result = await payload.find({
    collection: 'pages',
    sort: 'displayOrder',
    limit: 100,
    depth: 0,
  })

  const pages: SitePage[] = result.docs.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    published: p.published,
    showInNav: p.showInNav,
    isHomepage: p.isHomepage,
    displayOrder: p.displayOrder,
    updatedAt: p.updatedAt,
  }))

  const initialTheme = await getSiteDesign()

  return <SiteEditorClient initialPages={pages} initialProduct={initialProduct} initialTheme={initialTheme} />
}
