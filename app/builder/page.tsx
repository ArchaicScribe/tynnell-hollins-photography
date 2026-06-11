import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import payloadConfig from '@payload-config'

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
  let slug = toSlug(title) || `page-${Date.now()}`
  const existing = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  if (existing.docs.length > 0) slug = `${slug}-${String(Date.now()).slice(-5)}`

  await payload.create({
    collection: 'pages',
    data: { title, slug, published: false, content: { content: [], root: {} } },
  })
  redirect(`/builder/${slug}`)
}

export default async function BuilderHome() {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const { docs: pages } = await payload.find({ collection: 'pages', sort: '-updatedAt', limit: 100, depth: 0 })

  return (
    <main style={{ minHeight: '100vh', background: '#0c0c0c', color: '#e6e1de', fontFamily: "var(--font-body, 'Roboto Mono', monospace)", padding: '2.5rem clamp(1.25rem,4vw,4rem)' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <h1 style={{ fontFamily: "var(--font-heading, Archivo, sans-serif)", color: '#d6d1ce', fontSize: '1.75rem', margin: 0 }}>Pages</h1>
        <p style={{ color: '#9b9a9a', marginTop: '0.5rem' }}>Build and manage your site pages.</p>

        <form action={createPage} style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0 2rem' }}>
          <input
            name="title"
            placeholder="New page title"
            required
            style={{ flex: 1, background: '#1a1a1a', border: '1px solid rgba(155,154,154,0.25)', color: '#e6e1de', padding: '0.6rem 0.8rem', borderRadius: 4, fontFamily: 'inherit' }}
          />
          <button type="submit" style={{ background: '#9b9a9a', color: '#0c0c0c', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
            + New Page
          </button>
        </form>

        {pages.length === 0 ? (
          <p style={{ color: '#9b9a9a' }}>No pages yet. Create your first one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pages.map((p) => (
              <div key={String(p.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#131313', border: '1px solid rgba(155,154,154,0.15)', borderRadius: 4, padding: '0.85rem 1rem' }}>
                <div>
                  <div style={{ color: '#d6d1ce', fontFamily: "var(--font-heading, Archivo, sans-serif)" }}>{p.title}</div>
                  <div style={{ color: '#6b6a6a', fontSize: '0.72rem' }}>/{p.slug} &middot; {p.published ? 'Published' : 'Draft'}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {p.published && (
                    <Link href={`/${p.slug}`} target="_blank" style={{ color: '#9b9a9a', textDecoration: 'none', fontSize: '0.78rem', border: '1px solid rgba(155,154,154,0.25)', padding: '0.35rem 0.7rem', borderRadius: 4 }}>
                      View &#8599;
                    </Link>
                  )}
                  <Link href={`/builder/${p.slug}`} style={{ color: '#0c0c0c', background: '#d6d1ce', textDecoration: 'none', fontSize: '0.78rem', padding: '0.35rem 0.7rem', borderRadius: 4 }}>
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
