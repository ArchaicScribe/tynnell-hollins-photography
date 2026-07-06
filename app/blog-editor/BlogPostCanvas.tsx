'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Puck } from '@measured/puck'
import type { Data } from '@measured/puck'
import type { Post, Photo } from '@/payload-types'
import { blogBlocksConfig } from './blog-blocks.config'
import { HeroCoverPicker } from './HeroCoverPicker'
import { InlineEditableTitle } from './InlineEditableTitle'
import { CategoryPicker } from './CategoryPicker'
import { BlogBodyToolbar } from './BlogBodyToolbar'
import { BlogBodyFieldsPanel } from './BlogBodyFieldsPanel'
// Same CSS module the public /blog/[slug] page uses, imported directly so
// this canvas can never visually drift from what actually publishes.
import styles from '../(site)/blog/[slug]/page.module.css'
import '@measured/puck/puck.css'
import '../builder/puck-theme.css'

export type BlogPostEdits = {
  title: string
  category: string | null
  coverImageId: number | null
  body: Data
}

// HeroCoverPicker/InlineEditableTitle/CategoryPicker are discrete, already-
// committed actions (a click or a blur), so they save immediately. The body
// toolbar fires onEdit on every keystroke inside a block's fields, so those
// go through BlogEditorShell's debounce instead of saving on every character.
export function BlogPostCanvas({
  post,
  onEdit,
}: {
  post: Post
  onEdit: (edits: BlogPostEdits, opts?: { debounce?: boolean }) => void
}) {
  const initialCover = typeof post.coverImage === 'object' && post.coverImage !== null
    ? (post.coverImage as Photo)
    : null

  const [title, setTitle] = useState(post.title)
  const [category, setCategory] = useState<string | null>(post.category ?? null)
  const [cover, setCover] = useState<Photo | null>(initialCover)
  const [coverImageId, setCoverImageId] = useState<number | null>(initialCover?.id ?? null)
  const [bodyData, setBodyData] = useState<Data>((post.body as Data | null) ?? { content: [], root: {} })

  const coverUrl = cover?.sizes?.hero?.url ?? cover?.url ?? null

  const handleTitleCommit = (next: string) => {
    setTitle(next)
    onEdit({ title: next, category, coverImageId, body: bodyData })
  }

  const handleCategoryChange = (next: string) => {
    setCategory(next)
    onEdit({ title, category: next, coverImageId, body: bodyData })
  }

  const handleCoverSelect = async (photoId: number) => {
    setCoverImageId(photoId)
    onEdit({ title, category, coverImageId: photoId, body: bodyData })
    try {
      const res = await fetch(`/api/photos/${photoId}?depth=0`, { credentials: 'include' })
      if (res.ok) setCover(await res.json())
    } catch {
      // Non-fatal: the hero just won't refresh its preview until next load.
    }
  }

  const handleBodyChange = (next: Data) => {
    setBodyData(next)
    onEdit({ title, category, coverImageId, body: next }, { debounce: true })
  }

  return (
    <main className={styles.main} style={{ flex: 1 }}>
      <header className={styles.header}>
        <HeroCoverPicker onSelect={(id) => { void handleCoverSelect(id) }}>
          {coverUrl && (
            <div className={styles.coverImage}>
              <Image src={coverUrl} alt={cover?.alt ?? title} fill priority sizes="100vw" className={styles.coverPhoto} />
              <div className={styles.coverOverlay} />
            </div>
          )}
        </HeroCoverPicker>

        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>
            Journal &middot; <CategoryPicker value={category} onChange={handleCategoryChange} />
          </div>
          <InlineEditableTitle value={title} onCommit={handleTitleCommit} className={styles.title} />
          {post.publishedAt && (
            <time className={styles.date} dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          )}
        </div>
      </header>

      <article className={styles.article}>
        {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
        <div className="puck-dark blog-body-puck" style={{ height: '48vh' }}>
          <Puck
            config={blogBlocksConfig}
            data={bodyData}
            onChange={handleBodyChange}
            iframe={{ enabled: false }}
            overrides={{
              header: () => <></>,
              drawer: () => <></>,
            }}
          >
            <Puck.Preview />
            <BlogBodyToolbar />
            <BlogBodyFieldsPanel />
          </Puck>
        </div>
      </article>
    </main>
  )
}
