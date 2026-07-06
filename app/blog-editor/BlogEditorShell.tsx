'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Data } from '@measured/puck'
import type { Post } from '@/payload-types'
import { BlogPostSidebar } from './BlogPostSidebar'
import { BlogPostCanvas, type BlogPostEdits } from './BlogPostCanvas'
import { BlogEditorTopBar } from './BlogEditorTopBar'
import { PostSettingsPanel } from './PostSettingsPanel'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

// Body/title edits autosave after this pause in typing; cover/category saves
// fire immediately since those are discrete clicks, not continuous input.
const AUTOSAVE_DELAY = 1800

function editsFromPost(post: Post): BlogPostEdits {
  return {
    title: post.title,
    category: post.category ?? null,
    coverImageId: typeof post.coverImage === 'object' && post.coverImage !== null ? post.coverImage.id : (post.coverImage ?? null),
    body: (post.body as Data | null) ?? { content: [], root: {} },
  }
}

export function BlogEditorShell({ selectedPost }: { selectedPost: Post | null }) {
  const [post, setPost] = useState(selectedPost)
  const [status, setStatus] = useState<SaveStatus>('saved')
  const [publishing, setPublishing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const latestEdits = useRef<BlogPostEdits | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setPost(selectedPost)
    setStatus('saved')
    latestEdits.current = null
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
  }, [selectedPost])

  const save = useCallback(async (edits: BlogPostEdits, publish = false) => {
    if (!post) return
    setStatus('saving')
    try {
      const res = await fetch('/api/blog-editor/save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          patch: {
            title: edits.title,
            category: edits.category,
            coverImage: edits.coverImageId,
            body: edits.body,
          },
          publish,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      setStatus('saved')
      if (publish) setPost(prev => (prev ? { ...prev, status: 'published' } : prev))
    } catch {
      setStatus('error')
    }
  }, [post])

  const handleEdit = useCallback((edits: BlogPostEdits, opts?: { debounce?: boolean }) => {
    latestEdits.current = edits
    setStatus('unsaved')
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (opts?.debounce) {
      debounceTimer.current = setTimeout(() => { void save(edits) }, AUTOSAVE_DELAY)
    } else {
      void save(edits)
    }
  }, [save])

  const handlePublish = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    const edits = latestEdits.current ?? (post ? editsFromPost(post) : null)
    if (!edits) return
    setPublishing(true)
    void save(edits, true).finally(() => setPublishing(false))
  }, [post, save])

  const handleSettingsSaved = useCallback(() => {
    setStatus('saved')
  }, [])

  if (!post) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <BlogPostSidebar selectedSlug={null} />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--color-detail)' }}>Select a post, or create a new one.</p>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <BlogPostSidebar selectedSlug={post.slug} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <BlogEditorTopBar
          status={status}
          published={post.status === 'published'}
          onOpenSettings={() => setSettingsOpen(true)}
          onPublish={handlePublish}
          publishing={publishing}
        />
        <BlogPostCanvas post={post} onEdit={handleEdit} />
      </div>

      {settingsOpen && (
        <PostSettingsPanel
          postId={post.id}
          slug={post.slug}
          excerpt={post.excerpt ?? ''}
          publishedAt={post.publishedAt}
          onClose={() => setSettingsOpen(false)}
          onSaved={handleSettingsSaved}
        />
      )}
    </div>
  )
}
