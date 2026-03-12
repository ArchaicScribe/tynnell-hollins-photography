import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Blog | Tynnell Hollins Photography',
  description: 'Photography tips, session guides, and stories from behind the lens by Tynnell Hollins.',
}

interface Post {
  category: string
  title: string
  date: string
  excerpt: string
  slug: string
}

const POSTS: Post[] = [
  {
    category: 'Weddings',
    title: '5 Ways to Stay Present on Your Wedding Day',
    date: 'February 12, 2025',
    excerpt:
      'Your wedding day moves fast. Here are a few simple things couples can do to slow down and actually live inside the moments as they happen.',
    slug: '5-ways-to-stay-present-wedding-day',
  },
  {
    category: 'Session Tips',
    title: 'What to Wear for Your Portrait Session',
    date: 'January 28, 2025',
    excerpt:
      'Colors, textures, and silhouettes all affect how a photo feels. This guide walks you through building outfits that photograph beautifully.',
    slug: 'what-to-wear-portrait-session',
  },
  {
    category: 'Locations',
    title: "New Mexico's Most Beautiful Spots for Outdoor Sessions",
    date: 'January 8, 2025',
    excerpt:
      'From the red rocks of Abiquiú to the bosque at golden hour — a guide to the locations I return to again and again for their light and texture.',
    slug: 'new-mexico-outdoor-session-locations',
  },
  {
    category: 'Engagements',
    title: 'How to Feel Natural in Front of a Camera',
    date: 'December 5, 2024',
    excerpt:
      'Most people feel awkward in front of a lens at first. That\'s completely normal. Here\'s how I guide couples to relax and just be themselves.',
    slug: 'how-to-feel-natural-camera',
  },
  {
    category: 'Family',
    title: 'Photographing Kids: Why I Let Them Lead',
    date: 'November 19, 2024',
    excerpt:
      'The best family photos rarely happen when everyone is standing still and smiling. A little chaos is where the real magic lives.',
    slug: 'photographing-kids-let-them-lead',
  },
  {
    category: 'Behind the Lens',
    title: 'Why I Chose Film-Inspired Editing Over Clean Presets',
    date: 'October 30, 2024',
    excerpt:
      'There\'s a warmth and grain to film photography that digital needs to work for. My editing philosophy and why it matters for longevity.',
    slug: 'film-inspired-editing-philosophy',
  },
]

export default function BlogPage() {
  return (
    <main className={styles.main}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Journal</p>
        <h1 className={styles.heroHeading}>Stories from<br />Behind the Lens</h1>
      </section>

      {/* ── Posts grid ───────────────────────────────────────── */}
      <section className={styles.grid} aria-label="Blog posts">
        {POSTS.map((post) => (
          <article key={post.slug} className={styles.card}>
            <p className={styles.cardCategory}>{post.category}</p>
            <h2 className={styles.cardTitle}>
              <Link href={`/blog/${post.slug}`} className={styles.cardLink}>
                {post.title}
              </Link>
            </h2>
            <p className={styles.cardDate}>{post.date}</p>
            <p className={styles.cardExcerpt}>{post.excerpt}</p>
            <Link href={`/blog/${post.slug}`} className={styles.readMore} aria-label={`Read: ${post.title}`}>
              Read More
            </Link>
          </article>
        ))}
      </section>

    </main>
  )
}
