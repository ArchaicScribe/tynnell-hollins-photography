import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import payloadConfig from '@payload-config'
import type { Gallery, Photo } from '@/payload-types'

type GalleryWithExtra = Gallery & { status?: string | null; heroPhoto?: number | Photo | null }
import { GalleryEditorClient } from './GalleryEditorClient'

export const dynamic = 'force-dynamic'

export type PhotoItem = {
  id: number
  url: string | null
  thumbUrl: string | null
  alt: string | null
  filename: string | null
  category: string | null
}

export type GalleryListItem = {
  id: number
  title: string
  status: string
  coverThumb: string | null
  photoCount: number
}

type Props = { params: Promise<{ id: string }> }

export default async function GalleryEditorPage({ params }: Props) {
  const { id } = await params
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const [galleryResult, allGalleriesResult] = await Promise.all([
    payload.findByID({
      collection: 'galleries',
      id: Number(id),
      depth: 2,
    }),
    payload.find({
      collection: 'galleries',
      sort: 'displayOrder',
      limit: 200,
      depth: 1,
    }),
  ])

  if (!galleryResult) notFound()

  const gallery = galleryResult as GalleryWithExtra

  const initialPhotos: PhotoItem[] = Array.isArray(gallery.photos)
    ? gallery.photos
        .flatMap(item => {
          const p = item.photo
          if (typeof p !== 'object' || !p) return []
          const photo = p as Photo
          const result: PhotoItem = {
            id: photo.id,
            url: photo.sizes?.card?.url ?? photo.url ?? null,
            thumbUrl: photo.sizes?.thumbnail?.url ?? photo.sizes?.card?.url ?? photo.url ?? null,
            alt: photo.alt ?? null,
            filename: photo.filename ?? null,
            category: (photo.category as string | null) ?? null,
          }
          return [result]
        })
    : []

  const coverPhoto = typeof gallery.coverPhoto === 'object' && gallery.coverPhoto !== null
    ? gallery.coverPhoto as Photo
    : null

  const heroPhoto = typeof gallery.heroPhoto === 'object' && gallery.heroPhoto !== null
    ? gallery.heroPhoto as Photo
    : coverPhoto

  const allGalleries: GalleryListItem[] = (allGalleriesResult.docs as GalleryWithExtra[]).map(g => {
    const cover = typeof g.coverPhoto === 'object' && g.coverPhoto !== null ? g.coverPhoto as Photo : null
    return {
      id: g.id,
      title: g.title,
      status: g.status ?? 'published',
      coverThumb: cover?.sizes?.thumbnail?.url ?? cover?.sizes?.card?.url ?? cover?.url ?? null,
      photoCount: Array.isArray(g.photos) ? g.photos.length : 0,
    }
  })

  return (
    <GalleryEditorClient
      galleryId={gallery.id}
      initialTitle={gallery.title}
      initialSlug={typeof gallery.slug === 'string' ? gallery.slug : null}
      initialCategory={gallery.category ?? 'portraits'}
      initialStatus={gallery.status ?? 'published'}
      initialTapedStyle={gallery.tapedStyle ?? false}
      initialFeatured={gallery.featured ?? false}
      initialIsPasswordProtected={gallery.isPasswordProtected ?? false}
      initialPassword={typeof gallery.password === 'string' ? gallery.password : ''}
      initialCoverId={coverPhoto?.id ?? null}
      initialCoverThumb={coverPhoto?.sizes?.card?.url ?? coverPhoto?.url ?? null}
      initialHeroUrl={heroPhoto?.sizes?.hero?.url ?? heroPhoto?.url ?? null}
      initialPhotos={initialPhotos}
      allGalleries={allGalleries}
    />
  )
}
