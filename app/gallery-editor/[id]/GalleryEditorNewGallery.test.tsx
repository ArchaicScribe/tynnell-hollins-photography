// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { GalleryEditorClient } from './GalleryEditorClient'

type Props = ComponentProps<typeof GalleryEditorClient>

let requests: { method: string; url: string }[]

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  requests.push({ method: init?.method ?? 'GET', url: String(input) })
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
    initialPhotos: [],
    allGalleries: [{ id: 5, title: 'Smith Wedding', status: 'published', coverThumb: null, photoCount: 0 }],
    ...overrides,
  }
  return render(<GalleryEditorClient {...props} />)
}

beforeEach(() => {
  requests = []
  fetchMock.mockClear()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// TYN-311 follow-up: the editor used to have its own small dialog for creating
// a gallery, with no event date. It now opens the same Create New Collection
// page as everywhere else.
describe('gallery editor: adding a new gallery', () => {
  it('opens the Create New Collection page from the sidebar Add button', () => {
    renderEditor()

    expect(screen.getByRole('link', { name: 'New gallery' })).toHaveAttribute('href', '/gallery-editor/new')
  })

  it('no longer opens a dialog or asks for the presets', async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole('link', { name: 'New gallery' }))

    expect(screen.queryByRole('dialog', { name: /create new gallery/i })).toBeNull()
    expect(requests.some(r => r.url.startsWith('/api/globals/gallery-presets'))).toBe(false)
  })
})
