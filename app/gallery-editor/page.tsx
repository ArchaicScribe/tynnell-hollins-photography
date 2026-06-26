import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import payloadConfig from '@payload-config'
import type { Photo } from '@/payload-types'
import { GalleryIndexClient, type GalleryCard } from './GalleryIndexClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Galleries - Gallery Editor' }

export default async function GalleryEditorHome() {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const { docs } = await payload.find({
    collection: 'galleries',
    sort: 'displayOrder',
    limit: 200,
    depth: 1,
  })

  const galleries: GalleryCard[] = docs.map(g => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gAny = g as any
    const cover = typeof g.coverPhoto === 'object' && g.coverPhoto !== null ? g.coverPhoto as Photo : null
    return {
      id: g.id,
      title: g.title,
      slug: typeof g.slug === 'string' ? g.slug : null,
      category: g.category ?? null,
      status: gAny.status ?? 'published',
      photoCount: Array.isArray(g.photos) ? g.photos.length : 0,
      coverThumb: cover?.sizes?.card?.url ?? cover?.url ?? null,
      updatedAt: typeof g.updatedAt === 'string' ? g.updatedAt : null,
    }
  })

  return <GalleryIndexClient galleries={galleries} />
}
