'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './page.module.css'
import type { Photo } from '@/payload-types'

type PostSummary = {
  id: number
  title: string
  slug: string
  publishedAt: string | null
  category: string | null
  excerpt: string | null
  coverImage: Photo | null
}

const CATEGORY_LABELS: Record<string, string> = {
  'style-guide': 'Style Guide',
  'portrait-sessions': 'Portrait Sessions',
  'weddings': 'Weddings',
  'behind-the-lens': 'Behind the Lens',
  'client-education': 'Client Education',
}

const PAGE_SIZE = 12

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function getPhotoUrl(p: Photo | null): string | null {
  return p?.sizes?.card?.url ?? p?.sizes?.thumbnail?.url ?? p?.url ?? null
}

export default function BlogClient({
  posts,
  categories,
}: {
  posts: PostSummary[]
  categories: string[]
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const filtered = activeCategory
    ? posts.filter(p => p.category === activeCategory)
    : posts

  const shown = filtered.slice(0, visible)
  const hasMore = visible < filtered.length

  return (
    <>
      {/* Filter bar */}
      <div className={styles.filterBar}>
        <nav className={styles.filterCats} aria-label="Filter by category">
          <button
            className={activeCategory === null ? styles.filterCatActive : styles.filterCat}
            onClick={() => { setActiveCategory(null); setVisible(PAGE_SIZE) }}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={activeCategory === cat ? styles.filterCatActive : styles.filterCat}
              onClick={() => { setActiveCategory(cat); setVisible(PAGE_SIZE) }}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </nav>
        <button className={styles.filterSearchBtn} aria-label="Search posts" disabled>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.25" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Grid */}
      {shown.length === 0 ? (
        <p className={styles.emptyState}>No posts in this category yet.</p>
      ) : (
        <section className={styles.grid} aria-label="Blog posts">
          {shown.map(post => {
            const coverUrl = getPhotoUrl(post.coverImage)
            return (
              <article key={post.id} className={styles.card}>
                <Link href={`/blog/${post.slug}`} className={styles.cardImageLink} tabIndex={-1} aria-hidden="true">
                  <div className={styles.cardImage}>
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={post.coverImage?.alt ?? post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className={styles.cardPhoto}
                      />
                    ) : (
                      <div className={styles.cardPlaceholder} />
                    )}
                  </div>
                </Link>
                <div className={styles.cardBody}>
                  {post.category && (
                    <span className={styles.cardCat}>{CATEGORY_LABELS[post.category] ?? post.category}</span>
                  )}
                  <h2 className={styles.cardTitle}>
                    <Link href={`/blog/${post.slug}`} className={styles.cardLink}>
                      {post.title}
                    </Link>
                  </h2>
                  {post.publishedAt && (
                    <time className={styles.cardDate} dateTime={post.publishedAt}>
                      {formatDate(post.publishedAt)}
                    </time>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}

      {/* Load More */}
      {hasMore && (
        <div className={styles.loadMoreWrap}>
          <button
            className={styles.loadMore}
            onClick={() => setVisible(v => v + PAGE_SIZE)}
          >
            Load More
          </button>
        </div>
      )}
    </>
  )
}
