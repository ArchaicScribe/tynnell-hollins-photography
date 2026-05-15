import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import styles from './page.module.css'

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
    depth: 0,
    limit: 1,
  })
  const post = docs[0]
  if (!post) return { title: 'Post | Tynnell Hollins Photography' }
  return {
    title: `${post.title} | Tynnell Hollins Photography`,
    description: post.excerpt ?? undefined,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  const post = docs[0]

  if (!post) notFound()

  const cover = typeof post.coverImage === 'object' && post.coverImage !== null
    ? post.coverImage as Photo
    : null
  const coverUrl = cover?.sizes?.hero?.url ?? cover?.url ?? null

  return (
    <main className={styles.main}>

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
            <RichText data={post.body} />
          </div>
        )}
      </article>

      {/* Back link */}
      <div className={styles.footer}>
        <Link href="/blog" className={styles.back}>← Back to Journal</Link>
      </div>

    </main>
  )
}
