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
  return new Response(JSON.stringify({ doc: {}, lists: [] }), { status: 200 })
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

// TYN-311: the event date set when a collection is created can be changed here.
describe('gallery editor: event date', () => {
  it('shows the saved event date in Settings', async () => {
    const user = userEvent.setup()
    renderEditor({ initialEventDate: '2026-06-14' })
    await openSettings(user)

    expect(screen.getByLabelText('Event date')).toHaveValue('2026-06-14')
  })

  it('saves a changed event date', async () => {
    const user = userEvent.setup()
    renderEditor()
    await openSettings(user)

    await user.type(screen.getByLabelText('Event date'), '2026-09-05')
    await user.keyboard('{Control>}s{/Control}')

    await waitFor(() => expect(lastSave()).toMatchObject({ eventDate: '2026-09-05' }))
  })

  it('clears the event date when it is emptied', async () => {
    const user = userEvent.setup()
    renderEditor({ initialEventDate: '2026-06-14' })
    await openSettings(user)

    await user.clear(screen.getByLabelText('Event date'))
    await user.keyboard('{Control>}s{/Control}')

    await waitFor(() => expect(lastSave()).toMatchObject({ eventDate: null }))
  })
})
