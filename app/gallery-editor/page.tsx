import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import payloadConfig from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function GalleryEditorHome() {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const { docs } = await payload.find({
    collection: 'galleries',
    sort: 'displayOrder',
    limit: 1,
    depth: 0,
  })

  if (docs.length > 0) {
    redirect(`/gallery-editor/${docs[0].id}`)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0c0c', color: '#9b9a9a', fontFamily: "var(--font-body, 'Roboto Mono', monospace)", fontSize: '0.9rem' }}>
      <div style={{ textAlign: 'center' }}>
        <p>No galleries yet.</p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/admin/collections/galleries/create" style={{ color: '#d6d1ce', textDecoration: 'underline' }}>Create your first gallery in Admin</a>
      </div>
    </main>
  )
}
