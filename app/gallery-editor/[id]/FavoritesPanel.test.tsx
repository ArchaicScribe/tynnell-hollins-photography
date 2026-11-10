// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FavoritesPanel, type FavoritesPanelList } from './FavoritesPanel'

const photos = [1, 2, 3].map(id => ({
  id,
  thumbUrl: `https://media.example/smith-${id}-thumb.jpg`,
  filename: `smith-${id}.jpg`,
}))

let lists: FavoritesPanelList[]
let calls: { method: string; url: string }[]
const writeText = vi.fn()

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  const method = init?.method ?? 'GET'
  calls.push({ method, url })
  if (method === 'DELETE') {
    const id = Number(new URL(url, 'https://x.test').searchParams.get('list'))
    lists = lists.filter(l => l.id !== id)
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }
  return new Response(JSON.stringify({ lists }), { status: 200 })
})

beforeEach(() => {
  lists = [
    { id: 2, clientName: 'John Smith', clientEmail: 'john@example.com', photoIds: [2], sentAt: null, unsentChanges: true, updatedAt: '2026-11-09T10:00:00.000Z' },
    { id: 1, clientName: 'Jane Smith', clientEmail: 'jane@example.com', photoIds: [1, 3], sentAt: '2026-11-08T10:00:00.000Z', unsentChanges: false, updatedAt: '2026-11-08T10:00:00.000Z' },
  ]
  calls = []
  fetchMock.mockClear()
  writeText.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// userEvent.setup() installs its own clipboard, so ours goes in after it.
function setup() {
  const user = userEvent.setup()
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  return user
}

const renderPanel = (props: Partial<Parameters<typeof FavoritesPanel>[0]> = {}) =>
  render(<FavoritesPanel galleryId={5} enabled photos={photos} {...props} />)

describe('FavoritesPanel', () => {
  it('loads the lists for this gallery', async () => {
    renderPanel()
    await screen.findByRole('button', { name: /john smith/i })
    expect(calls[0]).toEqual({ method: 'GET', url: '/api/galleries/5/favorites' })
  })

  it('shows who chose, how many, and whether it was sent', async () => {
    renderPanel()
    const john = await screen.findByRole('button', { name: /john smith/i })
    expect(john).toHaveTextContent('1 photo')
    expect(john).toHaveTextContent(/not sent yet/i)
    const jane = screen.getByRole('button', { name: /jane smith/i })
    expect(jane).toHaveTextContent('2 photos')
    expect(jane).toHaveTextContent(/sent nov/i)
  })

  it('flags a list changed after it was sent', async () => {
    lists[1] = { ...lists[1], unsentChanges: true }
    renderPanel()
    expect(await screen.findByRole('button', { name: /jane smith/i })).toHaveTextContent(/changed since/i)
  })

  it("opens a client's list to show their photos and email", async () => {
    const user = setup()
    renderPanel()
    const jane = await screen.findByRole('button', { name: /jane smith/i })
    expect(jane).toHaveAttribute('aria-expanded', 'false')

    await user.click(jane)
    expect(jane).toHaveAttribute('aria-expanded', 'true')
    const region = screen.getByRole('region', { name: /jane smith/i })
    expect(within(region).getByRole('img', { name: 'smith-1.jpg' })).toBeInTheDocument()
    expect(within(region).getByRole('img', { name: 'smith-3.jpg' })).toBeInTheDocument()
    expect(within(region).queryByRole('img', { name: 'smith-2.jpg' })).toBeNull()
    expect(within(region).getByRole('link', { name: 'jane@example.com' })).toHaveAttribute('href', 'mailto:jane@example.com')
  })

  it('copies the file names, ready to paste into a Lightroom search', async () => {
    const user = setup()
    renderPanel()
    await user.click(await screen.findByRole('button', { name: /jane smith/i }))
    await user.click(screen.getByRole('button', { name: /copy file names/i }))
    expect(writeText).toHaveBeenCalledWith('smith-1.jpg, smith-3.jpg')
    expect(await screen.findByRole('button', { name: /copied/i })).toBeInTheDocument()
  })

  it('opens the list named in an emailed link straight away', async () => {
    renderPanel({ openListId: 1 })
    expect(await screen.findByRole('region', { name: /jane smith/i })).toBeInTheDocument()
  })

  it('deletes a list once confirmed', async () => {
    const user = setup()
    vi.stubGlobal('confirm', vi.fn(() => true))
    renderPanel()
    await user.click(await screen.findByRole('button', { name: /john smith/i }))
    await user.click(screen.getByRole('button', { name: /delete list/i }))

    await waitFor(() => expect(screen.queryByRole('button', { name: /john smith/i })).toBeNull())
    expect(calls).toContainEqual({ method: 'DELETE', url: '/api/galleries/5/favorites?list=2' })
    expect(screen.getByRole('button', { name: /jane smith/i })).toBeInTheDocument()
  })

  it('keeps the list when the delete is not confirmed', async () => {
    const user = setup()
    vi.stubGlobal('confirm', vi.fn(() => false))
    renderPanel()
    await user.click(await screen.findByRole('button', { name: /john smith/i }))
    await user.click(screen.getByRole('button', { name: /delete list/i }))
    expect(calls.some(c => c.method === 'DELETE')).toBe(false)
    expect(screen.getByRole('button', { name: /john smith/i })).toBeInTheDocument()
  })

  it('says so when no one has chosen favorites yet', async () => {
    lists = []
    renderPanel()
    expect(await screen.findByText(/no one has chosen favorites yet/i)).toBeInTheDocument()
  })

  it('points to Settings when favorites are turned off for the gallery', async () => {
    lists = []
    renderPanel({ enabled: false })
    expect(await screen.findByText(/turned off/i)).toBeInTheDocument()
  })

  it('says so when the lists cannot be loaded', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    renderPanel()
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i)
  })
})
