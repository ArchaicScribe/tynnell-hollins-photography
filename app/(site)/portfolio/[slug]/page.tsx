import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createHmac } from 'crypto'
import Link from 'next/link'
import { ProtectedImage } from '@/app/components/ProtectedImage/ProtectedImage'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import { GalleryViewer, type LightboxPhoto } from './GalleryViewer'
import { GalleryPasswordGate } from './GalleryPasswordGate'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ from?: string }> }

function validateGalleryToken(slug: string, passwordHash: string, token: string): boolean {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) return false
  const expected = createHmac('sha256', secret).update(`${slug}:${passwordHash}`).digest('hex')
  return token === expected
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
  if (!gallery) return { title: 'Gallery' }

  const cover = typeof gallery.coverPhoto === 'object' && gallery.coverPhoto !== null
    ? gallery.coverPhoto as Photo
    : null
  const ogImageUrl = cover?.sizes?.hero?.url ?? cover?.url ?? null

  return {
    title: `${gallery.title}`,
    description: `${gallery.title}, a ${gallery.category} session by Tynnell Hollins Photography.`,
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
  const backText = from ? `Back to ${from.charAt(0).toUpperCase() + from.slice(1)}` : 'Back to Portfolio'
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'galleries',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })
  const gallery = docs[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const galleryAny = gallery as any
  if (!gallery || galleryAny.status === 'draft') notFound()

  // Password gate: check cookie if gallery is protected
  if (galleryAny.isPasswordProtected && galleryAny.password) {
    const cookieStore = await cookies()
    const token = cookieStore.get(`gauth_${slug}`)?.value
    const authed = token ? validateGalleryToken(slug, galleryAny.password, token) : false
    if (!authed) {
      return <GalleryPasswordGate slug={slug} title={gallery.title} />
    }
  }

  const cover = typeof gallery.coverPhoto === 'object' && gallery.coverPhoto !== null
    ? gallery.coverPhoto as Photo
    : null
  // heroPhoto is the full-bleed banner; falls back to coverPhoto when not set.
  const heroRaw = galleryAny.heroPhoto
  const hero = typeof heroRaw === 'object' && heroRaw !== null ? heroRaw as Photo : cover
  const coverUrl = hero?.sizes?.hero?.url ?? hero?.url ?? null

  // gallery.photos is an ordered array of { photo: Photo | number } rows
  const rawPhotos: Photo[] = Array.isArray(gallery.photos)
    ? gallery.photos
        .map(item => item.photo)
        .filter((p): p is Photo => typeof p === 'object' && p !== null)
    : []

  const photos: LightboxPhoto[] = rawPhotos.map(p => ({
    id: p.id,
    thumbUrl: p.sizes?.card?.url ?? p.url ?? null,
    fullUrl: p.sizes?.hero?.url ?? p.url ?? null,
    alt: p.alt ?? null,
    caption: p.caption || null,
  }))

  const taped = gallery.tapedStyle === true

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
    description: `${gallery.title}, a ${gallery.category} session by Tynnell Hollins Photography.`,
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
      {coverUrl ? (
        <div className={styles.hero}>
          <ProtectedImage
            src={coverUrl}
            alt={hero?.alt ?? gallery.title}
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
      ) : (
        <div className={styles.heroTextOnly}>
          <p className={styles.eyebrow}>{gallery.category}</p>
          <h1 className={styles.headingDark}>{gallery.title}</h1>
          <p className={styles.photoCountDark}>{photos.length} photos</p>
        </div>
      )}

      {/* Back link + photo grid (with lightbox) */}
      <div className={styles.content}>
        <Link href={backHref} className={styles.back}>
          <span aria-hidden="true">&#8592;</span> {backText}
        </Link>
        <GalleryViewer photos={photos} taped={taped} />
      </div>

      {/* CTA */}
      <section className={styles.cta}>
        <p className={styles.ctaEyebrow}>Ready to create yours?</p>
        <h2 className={styles.ctaHeading}>{"Let's capture"}<br />{"your story."}</h2>
        <div className={styles.ctaActions}>
          <Link href="/book" className={styles.ctaBtn}>Book a Session</Link>
          <Link href="/contact" className={styles.ctaBtnSecondary}>Get in touch</Link>
        </div>
      </section>
    </main>
  )
}
