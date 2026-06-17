import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import payloadConfig from '@payload-config'
import { DeletePageButton } from './DeletePageButton'
import { PageTitleEditor } from './PageTitleEditor'
import { DuplicatePageButton } from './DuplicatePageButton'
import { NewPageForm } from './NewPageForm'
import { ReorderButtons } from './ReorderButtons'
import { PagePlacementToggles } from './PagePlacementToggles'
import { getTemplateContent } from './templates'

// Builder home (TYN-216): list pages + create a new one. Auth-gated.
export const dynamic = 'force-dynamic'

function toSlug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function createPage(formData: FormData): Promise<void> {
  'use server'
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const title = String(formData.get('title') ?? '').trim() || 'Untitled Page'
  const template = String(formData.get('template') ?? 'blank')
  let slug = toSlug(title) || `page-${Date.now()}`
  const existing = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  if (existing.docs.length > 0) slug = `${slug}-${String(Date.now()).slice(-5)}`

  await payload.create({
    collection: 'pages',
    data: { title, slug, published: false, content: getTemplateContent(template), displayOrder: Date.now() },
  })
  redirect(`/builder/${slug}`)
}

export default async function BuilderHome() {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const { docs: pages } = await payload.find({ collection: 'pages', sort: 'displayOrder', limit: 100, depth: 0 })

  return (
    <main style={{ minHeight: '100vh', background: '#0c0c0c', color: '#e6e1de', fontFamily: "var(--font-body, 'Roboto Mono', monospace)", padding: '2.5rem clamp(1.25rem,4vw,4rem)' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- cross root-layout: hard nav avoids the RSC-payload fetch error */}
        <a href="/admin" style={{ color: '#9b9a9a', textDecoration: 'none', fontSize: '0.78rem', letterSpacing: '0.04em' }}>&#8592; Back to Admin</a>
        <h1 style={{ fontFamily: "var(--font-heading, Archivo, sans-serif)", color: '#d6d1ce', fontSize: '1.75rem', margin: '1.25rem 0 0' }}>Pages</h1>
        <p style={{ color: '#9b9a9a', marginTop: '0.5rem' }}>Build and manage your site pages.</p>

        <NewPageForm action={createPage} />

        {pages.length === 0 ? (
          <p style={{ color: '#9b9a9a' }}>No pages yet. Create your first one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pages.map((p, i) => (
              <div key={String(p.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#131313', border: '1px solid rgba(155,154,154,0.15)', borderRadius: 4, padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <ReorderButtons id={p.id} isFirst={i === 0} isLast={i === pages.length - 1} />
                  <div>
                    <PageTitleEditor id={p.id} title={p.title} />
                    <div style={{ color: '#6b6a6a', fontSize: '0.72rem' }}>
                      /{p.slug} &middot; {p.published ? 'Published' : 'Draft'}
                      {p.updatedAt && ` · Updated ${new Date(p.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <PagePlacementToggles
                        id={p.id}
                        showInNav={Boolean(p.showInNav)}
                        isHomepage={Boolean(p.isHomepage)}
                        published={Boolean(p.published)}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {p.published && (
                    <Link href={`/${p.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#9b9a9a', textDecoration: 'none', fontSize: '0.78rem', border: '1px solid rgba(155,154,154,0.25)', padding: '0.35rem 0.7rem', borderRadius: 4 }}>
                      View &#8599;
                    </Link>
                  )}
                  <Link href={`/builder/${p.slug}`} style={{ color: '#0c0c0c', background: '#d6d1ce', textDecoration: 'none', fontSize: '0.78rem', padding: '0.35rem 0.7rem', borderRadius: 4 }}>
                    Edit
                  </Link>
                  <DuplicatePageButton id={p.id} />
                  <DeletePageButton id={p.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
