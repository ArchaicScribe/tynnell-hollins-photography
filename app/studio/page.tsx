import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import payloadConfig from '@payload-config'
import type { Photo } from '@/payload-types'
import { StudioClient } from './StudioClient'

export const dynamic = 'force-dynamic'

export default async function StudioPage() {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const [galleriesRes, photosRes] = await Promise.all([
    payload.find({ collection: 'galleries', limit: 6, sort: '-updatedAt', depth: 1 }),
    payload.find({ collection: 'photos', limit: 8, sort: '-updatedAt', depth: 0 }),
  ])

  const galleries = galleriesRes.docs.map(g => {
    const cover = typeof g.coverPhoto === 'object' && g.coverPhoto !== null ? g.coverPhoto as Photo : null
    return {
      id: g.id,
      title: g.title,
      slug: typeof g.slug === 'string' ? g.slug : null,
      status: g.status ?? 'published',
      photoCount: Array.isArray(g.photos) ? g.photos.length : undefined,
      coverPhoto: cover ? { url: cover.url ?? undefined, filename: cover.filename ?? undefined } : null,
    }
  })

  const photos = (photosRes.docs as Photo[]).map(p => ({
    id: p.id,
    filename: p.filename ?? '',
    url: p.url ?? undefined,
    width: p.width ?? undefined,
    height: p.height ?? undefined,
    updatedAt: p.updatedAt,
  }))

  return (
    <StudioClient
      userName={user.email ?? ''}
      galleries={galleries}
      photos={photos}
    />
  )
}
