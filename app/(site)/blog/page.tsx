import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import styles from './page.module.css'

// Blog listing — posts are published infrequently, revalidate every 2 minutes
export const revalidate = 120

export const metadata: Metadata = {
  title: 'Blog',
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

  const featuredPost = posts[0] ?? null
  const remainingPosts = posts.slice(1)

  // Pre-compute featured post data outside JSX to keep template readable
  const featuredCover =
    featuredPost && typeof featuredPost.coverImage === 'object' && featuredPost.coverImage !== null
      ? (featuredPost.coverImage as Photo)
      : null
  const featuredCoverUrl = featuredCover?.sizes?.hero?.url ?? featuredCover?.url ?? null
  const featuredSlug = featuredPost
    ? typeof featuredPost.slug === 'string' ? featuredPost.slug : ''
    : ''

  return (
    <main className={styles.main}>

      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Journal</p>
        <h1 className={styles.heroHeading}>Stories from<br />Behind the Lens</h1>
      </section>

      {posts.length === 0 ? (
        <p className={styles.emptyState}>New posts are on their way. Check back soon.</p>
      ) : (
        <>
          {/* Featured post — most recent, full width with cover hero */}
          {featuredPost && (
            <article className={styles.featured}>
              {featuredCoverUrl && (
                <Link
                  href={`/blog/${featuredSlug}`}
                  className={styles.featuredImageLink}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <div className={styles.featuredImage}>
                    <Image
                      src={featuredCoverUrl}
                      alt={featuredCover?.alt ?? featuredPost.title}
                      fill
                      priority
                      sizes="100vw"
                      className={styles.featuredPhoto}
                    />
                    <div className={styles.featuredOverlay} />
                  </div>
                </Link>
              )}
              <div className={styles.featuredContent}>
                <p className={styles.featuredEyebrow}>Latest Post</p>
                <h2 className={styles.featuredTitle}>
                  <Link href={`/blog/${featuredSlug}`} className={styles.featuredLink}>
                    {featuredPost.title}
                  </Link>
                </h2>
                {featuredPost.excerpt && (
                  <p className={styles.featuredExcerpt}>{featuredPost.excerpt}</p>
                )}
                <div className={styles.featuredMeta}>
                  {featuredPost.publishedAt && (
                    <span className={styles.featuredDate}>
                      {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                  )}
                  <Link href={`/blog/${featuredSlug}`} className={styles.featuredCta}>
                    Read Article
                  </Link>
                </div>
              </div>
            </article>
          )}

          {/* Remaining posts grid */}
          {remainingPosts.length > 0 && (
            <section className={styles.grid} aria-label="More posts">
              {remainingPosts.map((post) => {
                const cover =
                  typeof post.coverImage === 'object' && post.coverImage !== null
                    ? (post.coverImage as Photo)
                    : null
                const coverUrl = cover?.sizes?.card?.url ?? cover?.url ?? null
                const slug = typeof post.slug === 'string' ? post.slug : ''

                return (
                  <article key={post.id} className={styles.card}>
                    {coverUrl && (
                      <Link
                        href={`/blog/${slug}`}
                        className={styles.cardImageLink}
                        tabIndex={-1}
                        aria-hidden="true"
                      >
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
                        Read More
                      </Link>
                    </div>
                  </article>
                )
              })}
            </section>
          )}
        </>
      )}

    </main>
  )
}
