import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import styles from './page.module.css'

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
    limit: 100,
  })

  const featuredPost = posts[0] ?? null
  const featuredCover =
    featuredPost && typeof featuredPost.coverImage === 'object' && featuredPost.coverImage !== null
      ? (featuredPost.coverImage as Photo)
      : null
  const featuredCoverUrl = featuredCover?.sizes?.hero?.url ?? featuredCover?.url ?? null
  const featuredSlug = featuredPost
    ? (typeof featuredPost.slug === 'string' ? featuredPost.slug : '')
    : ''

  const blogSchema = posts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Journal',
    description: 'Photography tips, session guides, and stories from behind the lens by Tynnell Hollins.',
    url: 'https://tynnellhollinsphotography.com/blog',
    author: { '@type': 'Person', name: 'Tynnell Hollins', url: 'https://tynnellhollinsphotography.com/about' },
    blogPost: posts.slice(0, 10).map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.excerpt ?? undefined,
      datePublished: p.publishedAt,
      url: `https://tynnellhollinsphotography.com/blog/${typeof p.slug === 'string' ? p.slug : ''}`,
    })),
  } : null

  return (
    <main className={styles.main}>
      {blogSchema && <JsonLd data={blogSchema} />}

      {/* Hero - featured post cover fills the viewport width */}
      <section
        className={`${styles.hero} ${!featuredCoverUrl ? styles.heroFallback : ''}`}
        aria-label="Journal"
      >
        {featuredCoverUrl && featuredPost && (
          <Link
            href={`/blog/${featuredSlug}`}
            className={styles.heroImageLink}
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={featuredCoverUrl}
              alt={featuredCover?.alt ?? featuredPost.title}
              fill
              priority
              sizes="100vw"
              className={styles.heroPhoto}
            />
          </Link>
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Journal</p>
          {featuredPost ? (
            <>
              <h1 className={styles.heroTitle}>
                <Link href={`/blog/${featuredSlug}`} className={styles.heroTitleLink}>
                  {featuredPost.title}
                </Link>
              </h1>
              <div className={styles.heroMeta}>
                {featuredPost.publishedAt && (
                  <time className={styles.heroDate} dateTime={featuredPost.publishedAt}>
                    {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </time>
                )}
                <Link href={`/blog/${featuredSlug}`} className={styles.heroCta}>
                  Read Article
                </Link>
              </div>
            </>
          ) : (
            <h1 className={styles.heroTitle}>{"Stories from Behind the Lens"}</h1>
          )}
        </div>
      </section>

      {/* Journal bar */}
      <div className={styles.journalBar}>
        <span className={styles.journalLabel}>The Journal</span>
        {posts.length > 0 && (
          <span className={styles.journalCount}>
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        )}
      </div>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <p className={styles.emptyState}>New posts are on their way. Check back soon.</p>
      ) : (
        <section className={styles.grid} aria-label="All posts">
          {posts.map((post) => {
            const cover =
              typeof post.coverImage === 'object' && post.coverImage !== null
                ? (post.coverImage as Photo)
                : null
            const coverUrl = cover?.sizes?.card?.url ?? cover?.url ?? null
            const slug = typeof post.slug === 'string' ? post.slug : ''

            return (
              <article key={post.id} className={styles.card}>
                <Link
                  href={`/blog/${slug}`}
                  className={styles.cardImageLink}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <div className={styles.cardImage}>
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={cover?.alt ?? post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className={styles.cardPhoto}
                      />
                    ) : (
                      <div className={styles.cardPlaceholder} />
                    )}
                  </div>
                </Link>
                <div className={styles.cardBody}>
                  {post.publishedAt && (
                    <time className={styles.cardDate} dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </time>
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

      {/* CTA */}
      <section className={styles.cta}>
        <p className={styles.ctaEyebrow}>{"Let's work together"}</p>
        <h2 className={styles.ctaHeading}>{"Ready to book"}<br />{"your session?"}</h2>
        <div className={styles.ctaActions}>
          <Link href="/book" className={styles.ctaBtn}>Book a Session</Link>
          <Link href="/portfolio" className={styles.ctaBtnSecondary}>View Portfolio</Link>
        </div>
      </section>
    </main>
  )
}
