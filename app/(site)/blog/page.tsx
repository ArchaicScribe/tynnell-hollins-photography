import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Blog | Tynnell Hollins Photography',
  description: 'Photography tips, session guides, and stories from behind the lens by Tynnell Hollins.',
}

export default async function BlogPage() {
  const payload = await getPayload({ config })
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    depth: 1,
  })

  return (
    <main className={styles.main}>

      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Journal</p>
        <h1 className={styles.heroHeading}>Stories from<br />Behind the Lens</h1>
      </section>

      {/* Posts grid */}
      <section className={styles.grid} aria-label="Blog posts">
        {posts.length > 0 ? posts.map((post) => {
          const cover = typeof post.coverImage === 'object' && post.coverImage !== null
            ? post.coverImage as Photo
            : null
          const coverUrl = cover?.sizes?.card?.url ?? cover?.url ?? null
          const slug = typeof post.slug === 'string' ? post.slug : ''

          return (
            <article key={post.id} className={styles.card}>
              {coverUrl && (
                <Link href={`/blog/${slug}`} className={styles.cardImageLink} tabIndex={-1} aria-hidden="true">
                  <div className={styles.cardImage}>
                    <Image
                      src={coverUrl}
                      alt={cover?.alt ?? post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className={styles.cardPhoto}
                    />
                  </div>
                </Link>
              )}
              <div className={styles.cardBody}>
                {post.publishedAt && (
                  <p className={styles.cardDate}>
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                )}
                <h2 className={styles.cardTitle}>
                  <Link href={`/blog/${slug}`} className={styles.cardLink}>
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt && <p className={styles.cardExcerpt}>{post.excerpt}</p>}
                <Link
                  href={`/blog/${slug}`}
                  className={styles.readMore}
                  aria-label={`Read: ${post.title}`}
                >
                  Read More →
                </Link>
              </div>
            </article>
          )
        }) : (
          <p className={styles.emptyState}>
            New posts are on their way — check back soon.
          </p>
        )}
      </section>

    </main>
  )
}
