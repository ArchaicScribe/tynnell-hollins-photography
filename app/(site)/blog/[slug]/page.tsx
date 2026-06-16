import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from 'lexical'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import styles from './page.module.css'

// Post content rarely changes once published — revalidate every 2 minutes for fresh edits
export const revalidate = 120

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    depth: 0,
    limit: 1000,
  })
  return docs.map(p => ({ slug: typeof p.slug === 'string' ? p.slug : '' }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  const post = docs[0]
  if (!post) return { title: 'Post' }

  const cover = typeof post.coverImage === 'object' && post.coverImage !== null
    ? post.coverImage as Photo
    : null
  const ogImageUrl = cover?.sizes?.hero?.url ?? cover?.url ?? null

  return {
    title: `${post.title}`,
    description: post.excerpt ?? undefined,
    ...(ogImageUrl && {
      openGraph: {
        type: 'article',
        images: [{ url: ogImageUrl, width: 1920, height: 1080, alt: post.title }],
        publishedTime: post.publishedAt,
      },
      twitter: {
        images: [ogImageUrl],
      },
    }),
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { isEnabled: isPreview } = await draftMode()

  const [{ docs }, { docs: relatedDocs }] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: isPreview
        ? { slug: { equals: slug } }
        : { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
      depth: 1,
      limit: 1,
    }),
    payload.find({
      collection: 'posts',
      where: {
        and: [
          { status: { equals: 'published' } },
          { slug: { not_equals: slug } },
        ],
      },
      sort: '-publishedAt',
      depth: 1,
      limit: 3,
    }),
  ])

  const post = docs[0]
  if (!post) notFound()

  const cover = typeof post.coverImage === 'object' && post.coverImage !== null
    ? post.coverImage as Photo
    : null
  const coverUrl = cover?.sizes?.hero?.url ?? cover?.url ?? null

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: 'Tynnell Hollins',
      url: 'https://tynnellhollinsphotography.com/about',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Tynnell Hollins Photography',
      url: 'https://tynnellhollinsphotography.com',
    },
    url: `https://tynnellhollinsphotography.com/blog/${post.slug}`,
    ...(coverUrl && { image: coverUrl }),
  }

  return (
    <main className={styles.main}>
      <JsonLd data={blogPostingSchema} />

      {/* Hero */}
      <header className={styles.header}>
        {coverUrl && (
          <div className={styles.coverImage}>
            <Image
              src={coverUrl}
              alt={cover?.alt ?? post.title}
              fill
              priority
              sizes="100vw"
              className={styles.coverPhoto}
            />
            <div className={styles.coverOverlay} />
          </div>
        )}
        <div className={styles.headerContent}>
          <p className={styles.eyebrow}>Journal</p>
          <h1 className={styles.title}>{post.title}</h1>
          {post.publishedAt && (
            <p className={styles.date}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          )}
        </div>
      </header>

      {/* Body */}
      <article className={styles.article}>
        {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
        {post.body && (
          <div className={styles.body}>
            <RichText data={post.body as SerializedEditorState} />
          </div>
        )}
      </article>

      {/* Back link */}
      <div className={styles.footer}>
        <Link href="/blog" className={styles.back}>Back to Journal</Link>
      </div>

      {/* Related posts */}
      {relatedDocs.length > 0 && (
        <section className={styles.related}>
          <div className={styles.relatedInner}>
            <p className={styles.relatedLabel}>More from the Journal</p>
            <div className={styles.relatedGrid}>
              {relatedDocs.map((rp) => {
                const rpCover =
                  typeof rp.coverImage === 'object' && rp.coverImage !== null
                    ? (rp.coverImage as Photo)
                    : null
                const rpCoverUrl = rpCover?.sizes?.card?.url ?? rpCover?.url ?? null
                const rpSlug = typeof rp.slug === 'string' ? rp.slug : ''

                return (
                  <article key={rp.id} className={styles.relatedCard}>
                    {rpCoverUrl && (
                      <Link
                        href={`/blog/${rpSlug}`}
                        className={styles.relatedImageLink}
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <div className={styles.relatedImage}>
                          <Image
                            src={rpCoverUrl}
                            alt={rpCover?.alt ?? rp.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className={styles.relatedPhoto}
                          />
                        </div>
                      </Link>
                    )}
                    <div className={styles.relatedBody}>
                      {rp.publishedAt && (
                        <p className={styles.relatedDate}>
                          {new Date(rp.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </p>
                      )}
                      <h3 className={styles.relatedTitle}>
                        <Link href={`/blog/${rpSlug}`} className={styles.relatedLink}>
                          {rp.title}
                        </Link>
                      </h3>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      )}

    </main>
  )
}
