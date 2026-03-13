import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { sanityFetch } from '@/sanity/lib/live'
import { client } from '@/sanity/lib/client'
import { galleryBySlugQuery, allGallerySlugsQuery } from '@/sanity/queries'
import { urlFor } from '@/sanity/lib/image'
import styles from './page.module.css'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await client.fetch(allGallerySlugsQuery)
  return slugs.map(({ slug }: { slug: string }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: gallery } = await sanityFetch({ query: galleryBySlugQuery, params: { slug } })
  if (!gallery) return { title: 'Gallery | Tynnell Hollins Photography' }
  return {
    title: `${gallery.title} | Tynnell Hollins Photography`,
    description: `${gallery.title} — a ${gallery.category} session by Tynnell Hollins Photography.`,
  }
}

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params
  const { data: gallery } = await sanityFetch({ query: galleryBySlugQuery, params: { slug } })

  if (!gallery) notFound()

  const photos = gallery.photos ?? []

  return (
    <main className={styles.main}>
      {/* Hero */}
      {gallery.coverImage && (
        <div className={styles.hero}>
          <Image
            src={urlFor(gallery.coverImage.image).width(1600).height(900).fit('crop').auto('format').url()}
            alt={gallery.coverImage.alt ?? gallery.title}
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
        <Link href="/portfolio" className={styles.back}>
          ← Back to Portfolio
        </Link>

        {photos.length > 0 ? (
          <div className={styles.grid}>
            {photos.map((photo: { _id: string; image: object; alt: string; title: string }) => (
              <div key={photo._id} className={styles.imageSlot}>
                <Image
                  src={urlFor(photo.image).width(800).height(600).fit('crop').auto('format').url()}
                  alt={photo.alt ?? photo.title}
                  fill
                  sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
                  className={styles.photo}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Photos coming soon.</p>
        )}
      </div>
    </main>
  )
}
