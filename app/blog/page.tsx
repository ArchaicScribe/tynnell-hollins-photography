import type { Metadata } from 'next'
import Link from 'next/link'
import { client } from '@/sanity/lib/client'
import { postsQuery } from '@/sanity/queries'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Blog | Tynnell Hollins Photography',
  description: 'Photography tips, session guides, and stories from behind the lens by Tynnell Hollins.',
}

export const revalidate = 60

interface SanityPost {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt?: string
  coverImage?: { image: { asset: { _ref: string } }; alt: string }
}

export default async function BlogPage() {
  const posts: SanityPost[] = await client.fetch(postsQuery)

  return (
    <main className={styles.main}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Journal</p>
        <h1 className={styles.heroHeading}>Stories from<br />Behind the Lens</h1>
      </section>

      {/* ── Posts grid ───────────────────────────────────────── */}
      <section className={styles.grid} aria-label="Blog posts">
        {posts.length > 0 ? posts.map((post) => (
          <article key={post._id} className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Link href={`/blog/${post.slug.current}`} className={styles.cardLink}>
                {post.title}
              </Link>
            </h2>
            <p className={styles.cardDate}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
            {post.excerpt && <p className={styles.cardExcerpt}>{post.excerpt}</p>}
            <Link href={`/blog/${post.slug.current}`} className={styles.readMore} aria-label={`Read: ${post.title}`}>
              Read More
            </Link>
          </article>
        )) : (
          <p className={styles.emptyState}>
            New posts are on their way — check back soon.
          </p>
        )}
      </section>

    </main>
  )
}
