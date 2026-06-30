import type { Metadata } from 'next'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import BlogClient from './BlogClient'
import styles from './page.module.css'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog | Tynnell Hollins Photography',
  description: 'Photography tips, session guides, and stories from behind the lens by Tynnell Hollins.',
}

export default async function BlogPage() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    depth: 1,
    limit: 200,
  })

  const posts = docs.map(p => ({
    id: p.id,
    title: p.title,
    slug: typeof p.slug === 'string' ? p.slug : '',
    publishedAt: p.publishedAt ?? null,
    category: p.category ?? null,
    excerpt: p.excerpt ?? null,
    coverImage: (typeof p.coverImage === 'object' && p.coverImage !== null ? p.coverImage as Photo : null),
  }))

  // Hero: most recent post's cover photo
  const hero = posts[0] ?? null
  const heroCoverUrl = hero?.coverImage?.sizes?.hero?.url ?? hero?.coverImage?.url ?? null

  // Unique categories present in posts, in definition order
  const CAT_ORDER = ['style-guide', 'portrait-sessions', 'weddings', 'behind-the-lens', 'client-education']
  const presentCats = CAT_ORDER.filter(c => posts.some(p => p.category === c))

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
      url: `https://tynnellhollinsphotography.com/blog/${p.slug}`,
    })),
  } : null

  return (
    <main className={styles.main}>
      {blogSchema && <JsonLd data={blogSchema} />}

      {/* Hero */}
      <section className={styles.hero} aria-label="Blog">
        {heroCoverUrl && (
          <Image
            src={heroCoverUrl}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className={styles.heroPhoto}
          />
        )}
        <div className={styles.heroOverlay} aria-hidden="true" />
        <span className={styles.blogLabel} aria-hidden="true">B L O G</span>
      </section>

      {/* Filter + Grid + Load More (client) */}
      <BlogClient posts={posts} categories={presentCats} />
    </main>
  )
}
