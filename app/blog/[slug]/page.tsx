import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import { sanityFetch } from '@/sanity/lib/live'
import { client } from '@/sanity/lib/client'
import { postBySlugQuery, postsQuery } from '@/sanity/queries'
import { urlFor } from '@/sanity/lib/image'
import styles from './page.module.css'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const posts = await client.fetch(postsQuery)
  return posts.map(({ slug }: { slug: { current: string } }) => ({
    slug: slug.current,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: post } = await sanityFetch({ query: postBySlugQuery, params: { slug } })
  if (!post) return { title: 'Post | Tynnell Hollins Photography' }
  return {
    title: `${post.title} | Tynnell Hollins Photography`,
    description: post.excerpt ?? undefined,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const { data: post } = await sanityFetch({ query: postBySlugQuery, params: { slug } })

  if (!post) notFound()

  return (
    <main className={styles.main}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className={styles.header}>
        {post.coverImage && (
          <div className={styles.coverImage}>
            <Image
              src={urlFor(post.coverImage.image).width(1600).height(800).fit('crop').auto('format').url()}
              alt={post.coverImage.alt ?? post.title}
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
          <p className={styles.date}>
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <article className={styles.article}>
        {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
        {post.body && (
          <div className={styles.body}>
            <PortableText value={post.body} />
          </div>
        )}
      </article>

      {/* ── Back link ────────────────────────────────────────── */}
      <div className={styles.footer}>
        <Link href="/blog" className={styles.back}>← Back to Journal</Link>
      </div>

    </main>
  )
}
