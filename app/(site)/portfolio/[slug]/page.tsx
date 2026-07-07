import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import Link from 'next/link'
import { ProtectedImage } from '@/app/components/ProtectedImage/ProtectedImage'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import { GalleryViewer, type LightboxPhoto } from './GalleryViewer'
import { GalleryPasswordGate } from './GalleryPasswordGate'
import { DownloadAllButtonLoader as DownloadAllButton } from './DownloadButtonLoader'
import styles from './page.module.css'

// Investigated for ISR (TYN-291) and kept force-dynamic: whether this page
// reads the gauth_ cookie depends on gallery.isPasswordProtected, a DB value
// only known at request time. Converting to ISR would risk caching a private
// gallery's full photo set for anonymous visitors (or serving the password
// gate to an already-authorized one) depending on who happened to trigger
// the cached render - the App Router has no per-request cache-mode switch
// for a single route, so this stays fully dynamic.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ from?: string }> }

function validateGalleryToken(slug: string, passwordHash: string, token: string): boolean {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) return false
  try {
    const expected = createHmac('sha256', secret).update(`${slug}:${passwordHash}`).digest('hex')
    const a = Buffer.from(token)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
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

  // Don't reveal the gallery name or cover image in metadata before auth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((gallery as any).isPasswordProtected) {
    return { title: 'Private Gallery', robots: { index: false } }
  }

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
  if (!slug || !/^[a-z0-9-]{1,100}$/.test(slug)) notFound()
  const { from } = await searchParams
  const backHref = from ? `/portfolio?category=${from}` : '/portfolio'
  const backText = from ? `Back to ${from.charAt(0).toUpperCase() + from.slice(1)}` : 'Back to Portfolio'
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'galleries',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  const gallery = docs[0]

  if (!gallery || gallery.status === 'draft') notFound()

  // Password gate: check cookie if gallery is protected
  if (gallery.isPasswordProtected && gallery.password) {
    const cookieStore = await cookies()
    const token = cookieStore.get(`gauth_${slug}`)?.value
    const authed = token ? validateGalleryToken(slug, gallery.password, token) : false
    if (!authed) {
      return <GalleryPasswordGate slug={slug} />
    }
  }

  const cover = typeof gallery.coverPhoto === 'object' && gallery.coverPhoto !== null
    ? gallery.coverPhoto as Photo
    : null
  // heroPhoto is the full-bleed banner; falls back to coverPhoto when not set.
  const heroRaw = gallery.heroPhoto
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
  const allowDownload = gallery.allowDownload === true

  // Shape needed by the download component - only id, filename, url.
  const downloadPhotos = allowDownload
    ? rawPhotos.map(p => ({ id: p.id, filename: p.filename ?? null, url: p.url ?? null }))
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
        <div className={styles.contentHeader}>
          <Link href={backHref} className={styles.back}>
            <span aria-hidden="true">&#8592;</span> {backText}
          </Link>
          {allowDownload && (
            <DownloadAllButton
              gallerySlug={typeof gallery.slug === 'string' ? gallery.slug : ''}
              galleryTitle={gallery.title}
              photos={downloadPhotos}
            />
          )}
        </div>
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
