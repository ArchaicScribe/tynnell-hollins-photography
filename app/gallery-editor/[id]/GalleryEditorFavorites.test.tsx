// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { GalleryEditorClient } from './GalleryEditorClient'

type Props = ComponentProps<typeof GalleryEditorClient>

let requests: { method: string; url: string; body?: Record<string, unknown> }[]

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  const method = init?.method ?? 'GET'
  requests.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined })
  if (url.endsWith('/favorites')) {
    return new Response(JSON.stringify({
      lists: [{ id: 9, clientName: 'Jane Smith', clientEmail: 'jane@example.com', photoIds: [1], sentAt: null, unsentChanges: true, updatedAt: '2026-11-09T10:00:00.000Z' }],
    }), { status: 200 })
  }
  return new Response(JSON.stringify({ doc: {} }), { status: 200 })
})

function renderEditor(overrides: Partial<Props> = {}) {
  const props: Props = {
    galleryId: 5,
    initialTitle: 'Smith Wedding',
    initialSlug: 'smith-wedding',
    initialCategory: 'weddings',
    initialStatus: 'published',
    initialTapedStyle: false,
    initialFeatured: false,
    initialIsPasswordProtected: false,
    initialPasswordSet: false,
    initialAllowDownload: false,
    initialFavoritesEnabled: false,
    initialFavoritesLimit: null,
    initialFavoritesListId: null,
    initialSeoIndexable: true,
    initialClientName: '',
    initialClientEmail: '',
    initialEventDate: '',
    initialExpiresAt: '',
    initialCoverId: null,
    initialCoverThumb: null,
    initialHeroUrl: null,
    initialPhotos: [{ id: 1, url: 'https://media.example/1-card.jpg', thumbUrl: 'https://media.example/1-thumb.jpg', alt: null, filename: 'smith-1.jpg', category: 'weddings' }],
    allGalleries: [{ id: 5, title: 'Smith Wedding', status: 'published', coverThumb: null, photoCount: 1 }],
    ...overrides,
  }
  return render(<GalleryEditorClient {...props} />)
}

const lastSave = () => requests.filter(r => r.method === 'PATCH' && r.url === '/api/galleries/5').at(-1)?.body
const openSettings = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('button', { name: 'Settings' }))

beforeEach(() => {
  requests = []
  fetchMock.mockClear()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('gallery editor: client favorites', () => {
  it('saves the favorites switch when it is turned on', async () => {
    const user = userEvent.setup()
    renderEditor()
    await openSettings(user)

    const toggle = screen.getByRole('checkbox', { name: /client favorites/i })
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    await user.keyboard('{Control>}s{/Control}')

    await waitFor(() => expect(lastSave()).toMatchObject({ favoritesEnabled: true, favoritesLimit: null }))
  })

  it('only offers a limit once favorites are on, and saves it as a number', async () => {
    const user = userEvent.setup()
    renderEditor()
    await openSettings(user)
    expect(screen.queryByLabelText(/favorites limit/i)).toBeNull()

    await user.click(screen.getByRole('checkbox', { name: /client favorites/i }))
    await user.type(screen.getByLabelText(/favorites limit/i), '12')
    await user.keyboard('{Control>}s{/Control}')

    await waitFor(() => expect(lastSave()).toMatchObject({ favoritesEnabled: true, favoritesLimit: 12 }))
  })

  it('shows the saved switch and limit when the editor opens', async () => {
    const user = userEvent.setup()
    renderEditor({ initialFavoritesEnabled: true, initialFavoritesLimit: 20 })
    await openSettings(user)
    expect(screen.getByRole('checkbox', { name: /client favorites/i })).toBeChecked()
    expect(screen.getByLabelText(/favorites limit/i)).toHaveValue(20)
  })

  it("has a Favorites tab listing each client's picks", async () => {
    const user = userEvent.setup()
    renderEditor({ initialFavoritesEnabled: true })
    await user.click(screen.getByRole('button', { name: 'Favorites' }))
    expect(await screen.findByRole('button', { name: /jane smith/i })).toBeInTheDocument()
    expect(requests).toContainEqual({ method: 'GET', url: '/api/galleries/5/favorites', body: undefined })
  })

  it("opens straight to a client's list from the link in the favorites email", async () => {
    renderEditor({ initialFavoritesEnabled: true, initialFavoritesListId: 9 })
    expect(await screen.findByRole('region', { name: /jane smith/i })).toBeInTheDocument()
  })
})
