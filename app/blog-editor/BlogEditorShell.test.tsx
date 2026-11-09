// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { Post } from '@/payload-types'

// Puck measures layout and reads media queries the moment it is imported.
vi.hoisted(() => {
  const g = globalThis as Record<string, unknown>
  g.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  g.matchMedia = (media: string) => ({
    matches: false,
    media,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  })
})

// The post list fetches and routes on its own; it plays no part in save status.
vi.mock('./BlogPostSidebar', () => ({ BlogPostSidebar: () => null }))

import { BlogEditorShell } from './BlogEditorShell'

const api = vi.fn<typeof fetch>(async () => new Response('{}', { status: 200 }))

beforeEach(() => {
  vi.stubGlobal('fetch', api)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  api.mockClear()
})

function post(body: Post['body']): Post {
  return {
    id: 7,
    title: 'Spring Engagements',
    slug: 'spring-engagements',
    status: 'draft',
    body,
    publishedAt: '2026-11-01T12:00:00.000Z',
    updatedAt: '2026-11-01T12:00:00.000Z',
    createdAt: '2026-11-01T12:00:00.000Z',
  } as Post
}

// Longer than the editor's autosave debounce, so a save it queued would have fired.
const pastAutosave = () => new Promise((r) => setTimeout(r, 2200))

const saveCalls = () => api.mock.calls.filter(([url]) => String(url).includes('/api/blog-editor/save'))

describe('BlogEditorShell save status', () => {
  // "+ New Post" creates a post with no body; the editor starts it as
  // { content: [], root: {} } and Puck rewrites root to { props: {} } on load.
  it('opening a new post without editing it does not report unsaved changes', async () => {
    render(<BlogEditorShell selectedPost={post(null)} />)
    await new Promise((r) => setTimeout(r, 300))

    expect(screen.queryByText('Unsaved changes')).toBeNull()
    expect(screen.getByText('All changes saved')).toBeTruthy()
  })

  it('opening a post with content without editing it does not autosave', async () => {
    render(
      <BlogEditorShell
        selectedPost={post({ root: {}, content: [{ type: 'Text', props: { id: 'text-1', text: 'We met at golden hour.' } }] })}
      />,
    )
    await pastAutosave()

    // Puck really rendered the saved body, so it had the chance to report a change.
    expect(screen.getByText('We met at golden hour.')).toBeTruthy()
    expect(saveCalls()).toEqual([])
    expect(screen.getByText('All changes saved')).toBeTruthy()
  })
})
