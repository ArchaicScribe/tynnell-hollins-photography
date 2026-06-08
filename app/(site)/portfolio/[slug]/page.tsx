import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProtectedImage } from '@/app/components/ProtectedImage/ProtectedImage'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import styles from './page.module.css'

// Gallery content changes when photos are added — revalidate every 2 minutes
export const revalidate = 120

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ from?: string }> }

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'galleries',
    depth: 0,
    limit: 1000,
  })
  return docs.map(g => ({ slug: typeof g.slug === 'string' ? g.slug : '' }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'galleries',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  const gallery = docs[0]
  if (!gallery) return { title: 'Gallery | Tynnell Hollins Photography' }

  const cover = typeof gallery.coverPhoto === 'object' && gallery.coverPhoto !== null
    ? gallery.coverPhoto as Photo
    : null
  const ogImageUrl = cover?.sizes?.hero?.url ?? cover?.url ?? null

  return {
    title: `${gallery.title} | Tynnell Hollins Photography`,
    description: `${gallery.title} — a ${gallery.category} session by Tynnell Hollins Photography.`,
    ...(ogImageUrl && {
      openGraph: {
        images: [{ url: ogImageUrl, width: 1920, height: 1080, alt: gallery.title }],
      },
      twitter: {
        images: [ogImageUrl],
      },
    }),
  }
}

export default async function GalleryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { from } = await searchParams
  const backHref = from ? `/portfolio?category=${from}` : '/portfolio'
  const backLabel = from ? `← Back to ${from.charAt(0).toUpperCase() + from.slice(1)}` : '← Back to Portfolio'
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'galleries',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })
  const gallery = docs[0]

  if (!gallery) notFound()

  const cover = typeof gallery.coverPhoto === 'object' && gallery.coverPhoto !== null
    ? gallery.coverPhoto as Photo
    : null
  const coverUrl = cover?.sizes?.hero?.url ?? cover?.url ?? null

  const photos: Photo[] = Array.isArray(gallery.photos)
    ? gallery.photos.filter((p): p is Photo => typeof p === 'object' && p !== null)
    : []

  const pageUrl = `https://tynnellhollinsphotography.com/portfolio/${gallery.slug}`
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Portfolio', item: 'https://tynnellhollinsphotography.com/portfolio' },
      { '@type': 'ListItem', position: 2, name: gallery.title, item: pageUrl },
    ],
  }
  const imageGallerySchema = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: gallery.title,
    description: `${gallery.title} — a ${gallery.category} session by Tynnell Hollins Photography.`,
    url: pageUrl,
    author: { '@type': 'Person', name: 'Tynnell Hollins' },
    ...(coverUrl && { thumbnailUrl: coverUrl }),
    numberOfItems: photos.length,
  }

  return (
    <main className={styles.main}>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={imageGallerySchema} />
      {/* Hero */}
      {coverUrl && (
        <div className={styles.hero}>
          <ProtectedImage
            src={coverUrl}
            alt={cover?.alt ?? gallery.title}
            fill
            priority
            className={styles.heroImage}
            sizes="100vw"
          />
          <div className={styles.heroOverlay}>
            <p className={styles.eyebrow}>{gallery.category}</p>
            <h1 className={styles.heading}>{gallery.title}</h1>
            <p className={styles.photoCount}>{photos.length} photos</p>
          </div>
        </div>
      )}

      {/* Back link + grid */}
      <div className={styles.content}>
        <Link href={backHref} className={styles.back}>
          {backLabel}
        </Link>

        {photos.length > 0 ? (
          <div className={styles.grid}>
            {photos.map((photo) => {
              const url = photo.sizes?.card?.url ?? photo.url ?? null
              if (!url) return null
              const caption = photo.alt || photo.title || null
              return (
                <div key={String(photo.id)} className={styles.imageWrapper}>
                  <div className={styles.imageSlot}>
                    <ProtectedImage
                      src={url}
                      alt={photo.alt ?? photo.title ?? ''}
                      fill
                      sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
                      className={styles.photo}
                    />
                  </div>
                  {caption && <p className={styles.caption}>{caption}</p>}
                </div>
              )
            })}
          </div>
        ) : (
          <p className={styles.empty}>Photos coming soon.</p>
        )}
      </div>
    </main>
  )
}
