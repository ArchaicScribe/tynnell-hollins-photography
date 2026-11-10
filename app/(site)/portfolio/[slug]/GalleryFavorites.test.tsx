// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GalleryViewer, type LightboxPhoto } from './GalleryViewer'

const SLUG = 'smith-wedding'

const photos: LightboxPhoto[] = [1, 2, 3].map(id => ({
  id,
  thumbUrl: `https://media.example/smith-${id}-card.jpg`,
  fullUrl: `https://media.example/smith-${id}-hero.jpg`,
  alt: `Smith wedding ${id}`,
  caption: null,
}))

// ---------------------------------------------------------------------------
// A stand-in for /api/favorites/*, holding what the real routes would hold.
// ---------------------------------------------------------------------------

type ServerList = { name: string; email: string; photoIds: number[]; sentAt: string | null; unsentChanges: boolean }
let server: { list: ServerList | null; limit: number | null; failToggle: boolean }
let calls: { method: string; path: string; body?: Record<string, unknown> }[]

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
}

const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(String(input), 'https://tynnellhollinsphotography.com')
  const method = init?.method ?? 'GET'
  const body = init?.body ? JSON.parse(String(init.body)) : undefined
  calls.push({ method, path: url.pathname, body })
  const state = () => ({ list: server.list, limit: server.limit })

  if (url.pathname === '/api/favorites' && method === 'GET') return json(state())
  if (url.pathname === '/api/favorites' && method === 'DELETE') {
    server.list = null
    return json({ ok: true })
  }
  if (url.pathname === '/api/favorites/start') {
    server.list ??= { name: body.name, email: body.email, photoIds: [], sentAt: null, unsentChanges: false }
    return json(state())
  }
  if (url.pathname === '/api/favorites/toggle') {
    if (server.failToggle) return json({ error: 'Something went wrong. Please try again.' }, 500)
    const list = server.list!
    list.photoIds = body.favorited
      ? [...new Set([...list.photoIds, body.photoId])]
      : list.photoIds.filter(id => id !== body.photoId)
    list.unsentChanges = list.photoIds.length > 0
    return json(state())
  }
  if (url.pathname === '/api/favorites/send') {
    server.list = { ...server.list!, sentAt: '2026-11-10T16:00:00.000Z', unsentChanges: false }
    return json(state())
  }
  return json({ error: 'not found' }, 404)
})

const jane = (photoIds: number[] = []): ServerList =>
  ({ name: 'Jane Smith', email: 'jane@example.com', photoIds, sentAt: null, unsentChanges: photoIds.length > 0 })

beforeEach(() => {
  server = { list: null, limit: null, failToggle: false }
  calls = []
  fetchMock.mockClear()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const renderGallery = () => render(<GalleryViewer photos={photos} taped={false} favorites={{ slug: SLUG }} />)
const heart = (n: number) => screen.getByRole('button', { name: new RegExp(`photo ${n} (to|from) favorites`, 'i') })
const loaded = () => waitFor(() => expect(calls.some(c => c.method === 'GET')).toBe(true))

describe('gallery without favorites', () => {
  it('shows no hearts and never asks the server about favorites', () => {
    render(<GalleryViewer photos={photos} taped={false} />)
    expect(screen.queryByRole('button', { name: /favorites/i })).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('gallery with favorites', () => {
  it('shows a heart on every photo, not yet chosen', async () => {
    renderGallery()
    await loaded()
    for (const n of [1, 2, 3]) {
      expect(heart(n)).toHaveAccessibleName(`Add photo ${n} to favorites`)
      expect(heart(n)).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('asks for a name and email on the first heart, then saves that photo', async () => {
    const user = userEvent.setup()
    renderGallery()
    await loaded()

    await user.click(heart(2))
    const dialog = screen.getByRole('dialog', { name: /favorites/i })
    await user.type(within(dialog).getByLabelText(/name/i), 'Jane Smith')
    await user.type(within(dialog).getByLabelText(/email/i), 'jane@example.com')
    await user.click(within(dialog).getByRole('button', { name: /start/i }))

    await waitFor(() => expect(heart(2)).toHaveAttribute('aria-pressed', 'true'))
    expect(heart(2)).toHaveAccessibleName('Remove photo 2 from favorites')
    expect(screen.queryByRole('dialog', { name: /favorites/i })).toBeNull()
    expect(calls.find(c => c.path === '/api/favorites/start')?.body)
      .toEqual({ gallery: SLUG, name: 'Jane Smith', email: 'jane@example.com' })
    expect(server.list?.photoIds).toEqual([2])
    expect(screen.getByText(/1 favorite\b/i)).toBeInTheDocument()
  })

  it('does not un-heart a photo when the email already had it as a favorite', async () => {
    const user = userEvent.setup()
    renderGallery()
    await loaded()
    // Jane chose photo 2 on her phone; this is her laptop, with no cookie yet.
    fetchMock.mockImplementationOnce(() => {
      server.list = jane([2])
      return json({ list: server.list, limit: null })
    })

    await user.click(heart(2))
    const dialog = screen.getByRole('dialog', { name: /favorites/i })
    await user.type(within(dialog).getByLabelText(/name/i), 'Jane')
    await user.type(within(dialog).getByLabelText(/email/i), 'jane@example.com')
    await user.click(within(dialog).getByRole('button', { name: /start/i }))

    await waitFor(() => expect(heart(2)).toHaveAttribute('aria-pressed', 'true'))
    expect(server.list?.photoIds).toEqual([2])
  })

  it('closes the name and email prompt without saving when cancelled', async () => {
    const user = userEvent.setup()
    renderGallery()
    await loaded()
    await user.click(heart(1))
    await user.click(within(screen.getByRole('dialog', { name: /favorites/i })).getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog', { name: /favorites/i })).toBeNull()
    expect(heart(1)).toHaveAttribute('aria-pressed', 'false')
    expect(calls.some(c => c.path === '/api/favorites/start')).toBe(false)
  })

  it('shows the hearts chosen on an earlier visit', async () => {
    server.list = jane([1, 3])
    renderGallery()
    await waitFor(() => expect(heart(1)).toHaveAttribute('aria-pressed', 'true'))
    expect(heart(2)).toHaveAttribute('aria-pressed', 'false')
    expect(heart(3)).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/2 favorites/i)).toBeInTheDocument()
  })

  it('removes a favorite when its heart is pressed again', async () => {
    const user = userEvent.setup()
    server.list = jane([1, 3])
    renderGallery()
    await waitFor(() => expect(heart(1)).toHaveAttribute('aria-pressed', 'true'))

    await user.click(heart(1))
    await waitFor(() => expect(server.list?.photoIds).toEqual([3]))
    expect(heart(1)).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/1 favorite\b/i)).toBeInTheDocument()
  })

  it('puts the heart back and says so when saving fails', async () => {
    const user = userEvent.setup()
    server.list = jane([1])
    server.failToggle = true
    renderGallery()
    await waitFor(() => expect(heart(1)).toHaveAttribute('aria-pressed', 'true'))

    await user.click(heart(2))
    expect(await screen.findByRole('alert')).toHaveTextContent(/try again/i)
    expect(heart(2)).toHaveAttribute('aria-pressed', 'false')
    expect(heart(1)).toHaveAttribute('aria-pressed', 'true')
  })

  it('stops further hearts at the gallery limit and says why', async () => {
    const user = userEvent.setup()
    server.list = jane([1, 2])
    server.limit = 2
    renderGallery()
    await waitFor(() => expect(heart(1)).toHaveAttribute('aria-pressed', 'true'))

    expect(screen.getByText(/2 of 2 favorites/i)).toBeInTheDocument()
    expect(heart(3)).toBeDisabled()
    expect(heart(3)).toHaveAttribute('title', expect.stringMatching(/2 favorites/))
    // Hearts already chosen stay usable, so the client can swap one out.
    expect(heart(1)).toBeEnabled()
    await user.click(heart(1))
    await waitFor(() => expect(heart(3)).toBeEnabled())
  })

  it('can show only the favorites, and all photos again', async () => {
    const user = userEvent.setup()
    server.list = jane([1, 3])
    renderGallery()
    await waitFor(() => expect(heart(1)).toHaveAttribute('aria-pressed', 'true'))

    await user.click(screen.getByRole('button', { name: /show favorites/i }))
    expect(screen.queryByRole('button', { name: /open photo.*smith wedding 2/i })).toBeNull()
    expect(screen.getAllByRole('button', { name: /^open photo/i })).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: /show all photos/i }))
    expect(screen.getAllByRole('button', { name: /^open photo/i })).toHaveLength(3)
  })

  it('sends the favorites to Tynnell and confirms it', async () => {
    const user = userEvent.setup()
    server.list = jane([1, 3])
    renderGallery()
    const sendButton = await screen.findByRole('button', { name: /send to tynnell/i })

    await user.click(sendButton)
    expect(await screen.findByText(/sent to tynnell/i)).toBeInTheDocument()
    expect(calls.find(c => c.path === '/api/favorites/send')?.body).toEqual({ gallery: SLUG })
    // Nothing new to send, so the button goes away until the list changes.
    expect(screen.queryByRole('button', { name: /send/i })).toBeNull()

    await user.click(heart(2))
    expect(await screen.findByRole('button', { name: /send update to tynnell/i })).toBeInTheDocument()
  })

  it('offers nothing to send before any photo is chosen', async () => {
    server.list = jane([])
    renderGallery()
    await screen.findByText(/choosing as jane smith/i)
    expect(screen.queryByRole('button', { name: /send/i })).toBeNull()
  })

  it('lets a different person take over on a shared device', async () => {
    const user = userEvent.setup()
    server.list = jane([1])
    renderGallery()
    await user.click(await screen.findByRole('button', { name: /not you/i }))

    await waitFor(() => expect(heart(1)).toHaveAttribute('aria-pressed', 'false'))
    expect(calls.some(c => c.method === 'DELETE' && c.path === '/api/favorites')).toBe(true)
    expect(screen.queryByText(/choosing as/i)).toBeNull()
  })

  it('has a heart for the photo open in the lightbox', async () => {
    const user = userEvent.setup()
    server.list = jane([])
    renderGallery()
    await screen.findByText(/choosing as jane smith/i)

    await user.click(screen.getByRole('button', { name: /open photo 2/i }))
    const lightbox = screen.getByRole('dialog', { name: /photo 2 of 3/i })
    await user.click(within(lightbox).getByRole('button', { name: /add photo 2 to favorites/i }))
    await waitFor(() => expect(server.list?.photoIds).toEqual([2]))
    expect(within(lightbox).getByRole('button', { name: /remove photo 2 from favorites/i })).toBeInTheDocument()
  })
  it('keeps the lightbox open and the page locked while the name prompt is over it', async () => {
    const user = userEvent.setup()
    renderGallery()
    await loaded()

    await user.click(screen.getByRole('button', { name: /open photo 2/i }))
    await user.click(within(screen.getByRole('dialog', { name: /photo 2 of 3/i })).getByRole('button', { name: /add photo 2 to favorites/i }))
    expect(screen.getByRole('dialog', { name: /choose your favorites/i })).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')

    // Escape closes the prompt only; the photo stays open behind it.
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /choose your favorites/i })).toBeNull()
    expect(screen.getByRole('dialog', { name: /photo 2 of 3/i })).toBeInTheDocument()
  })
})
