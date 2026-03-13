import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { sanityFetch } from '@/sanity/lib/live'
import { postsQuery } from '@/sanity/queries'
import { urlFor } from '@/sanity/lib/image'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Blog | Tynnell Hollins Photography',
  description: 'Photography tips, session guides, and stories from behind the lens by Tynnell Hollins.',
}

export default async function BlogPage() {
  const { data: posts } = await sanityFetch({ query: postsQuery })

  return (
    <main className={styles.main}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Journal</p>
        <h1 className={styles.heroHeading}>Stories from<br />Behind the Lens</h1>
      </section>

      {/* ── Posts grid ───────────────────────────────────────── */}
      <section className={styles.grid} aria-label="Blog posts">
        {posts && posts.length > 0 ? posts.map((post) => (
          <article key={post._id} className={styles.card}>
            {post.coverImage && (
              <Link href={`/blog/${post.slug.current}`} className={styles.cardImageLink} tabIndex={-1} aria-hidden="true">
                <div className={styles.cardImage}>
                  <Image
                    src={urlFor(post.coverImage.image).width(600).height(400).fit('crop').auto('format').url()}
                    alt={post.coverImage.alt ?? post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={styles.cardPhoto}
                  />
                </div>
              </Link>
            )}
            <div className={styles.cardBody}>
              <p className={styles.cardDate}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
              <h2 className={styles.cardTitle}>
                <Link href={`/blog/${post.slug.current}`} className={styles.cardLink}>
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && <p className={styles.cardExcerpt}>{post.excerpt}</p>}
              <Link
                href={`/blog/${post.slug.current}`}
                className={styles.readMore}
                aria-label={`Read: ${post.title}`}
              >
                Read More →
              </Link>
            </div>
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
