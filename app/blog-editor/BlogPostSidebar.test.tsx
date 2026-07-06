// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const { BlogPostSidebar } = await import('./BlogPostSidebar')

function mockFetchOnce(response: unknown, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(response),
  }))
}

beforeEach(() => {
  pushMock.mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('BlogPostSidebar', () => {
  it('renders a row per post with title and status', async () => {
    mockFetchOnce({
      docs: [
        { id: 1, title: 'First Post', slug: 'first-post', status: 'published', publishedAt: '2026-01-01' },
        { id: 2, title: 'Draft Post', slug: 'draft-post', status: 'draft', publishedAt: null },
      ],
    })

    render(<BlogPostSidebar selectedSlug={null} />)

    expect(await screen.findByText('First Post')).toBeInTheDocument()
    expect(screen.getByText('Draft Post')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('shows an empty state when there are no posts', async () => {
    mockFetchOnce({ docs: [] })
    render(<BlogPostSidebar selectedSlug={null} />)
    expect(await screen.findByText(/click \+ new post to write your first one/i)).toBeInTheDocument()
  })

  it('shows an error message when the fetch fails', async () => {
    mockFetchOnce({}, false)
    render(<BlogPostSidebar selectedSlug={null} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load posts/i)
  })

  it('links each row to its editor route, highlighting the selected post', async () => {
    mockFetchOnce({
      docs: [{ id: 1, title: 'First Post', slug: 'first-post', status: 'published', publishedAt: '2026-01-01' }],
    })

    render(<BlogPostSidebar selectedSlug="first-post" />)

    const link = await screen.findByText('First Post')
    expect(link.closest('a')).toHaveAttribute('href', '/blog-editor/first-post')
  })

  it('debounces search input before refetching', async () => {
    mockFetchOnce({ docs: [] })
    render(<BlogPostSidebar selectedSlug={null} />)
    await screen.findByText(/click \+ new post/i)

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockClear()

    fireEvent.change(screen.getByPlaceholderText('Search posts...'), { target: { value: 'wedding' } })
    // Debounce is 300ms - immediately after typing, no fetch should have fired yet.
    expect(fetchMock).not.toHaveBeenCalled()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('where%5Btitle%5D%5Bcontains%5D=wedding'),
      expect.anything(),
    ))
  })

  it('creates a new post and navigates to it when "+ New Post" is clicked', async () => {
    mockFetchOnce({ docs: [] })
    render(<BlogPostSidebar selectedSlug={null} />)
    await screen.findByText(/click \+ new post/i)

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ slug: 'untitled-123' }) })

    fireEvent.click(screen.getByRole('button', { name: '+ New Post' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/blog-editor/untitled-123'))
    expect(fetchMock).toHaveBeenCalledWith('/api/blog-editor/create', expect.objectContaining({ method: 'POST' }))
  })
})
