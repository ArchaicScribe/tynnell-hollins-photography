import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { PhotoLibraryClient } from './PhotoLibraryClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Photo Library' }

export type LibraryPhoto = {
  id: number
  filename: string | null
  url: string | null
  thumbUrl: string | null
  cardUrl: string | null
  category: string | null
  featured: boolean
  createdAt: string
  width?: number | null
  height?: number | null
}

export default async function PhotoLibraryPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const { docs } = await payload.find({
    collection: 'photos',
    limit: 500,
    depth: 0,
    sort: '-createdAt',
  })

  const photos: LibraryPhoto[] = docs.map(p => ({
    id: p.id,
    filename: p.filename ?? null,
    url: p.url ?? null,
    thumbUrl: p.sizes?.thumbnail?.url ?? p.sizes?.card?.url ?? p.url ?? null,
    cardUrl: p.sizes?.card?.url ?? p.url ?? null,
    category: (p.category as string | null) ?? null,
    featured: p.featured ?? false,
    createdAt: p.createdAt,
    width: p.width ?? null,
    height: p.height ?? null,
  }))

  return <PhotoLibraryClient initialPhotos={photos} />
}
