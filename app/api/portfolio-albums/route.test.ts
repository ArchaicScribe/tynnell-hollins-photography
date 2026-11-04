import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const findMock = vi.fn()

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ find: findMock }),
}))

vi.mock('@payload-config', () => ({ default: {} }))

const { GET } = await import('./route')

const PAST = '2020-01-01T00:00:00.000Z'
const FUTURE = '2999-01-01T00:00:00.000Z'

function gallery(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    slug: `gallery-${id}`,
    title: `Gallery ${id}`,
    status: 'published',
    isPasswordProtected: false,
    expiresAt: null,
    coverPhoto: { id: 100 + id, url: `https://media.example/cover-${id}.jpg`, alt: null },
    photos: [{ photo: { id: 200 + id, url: `https://media.example/p-${id}.jpg` } }],
    ...overrides,
  }
}

beforeEach(() => {
  findMock.mockReset()
})

describe('GET /api/portfolio-albums', () => {
  it('lists only galleries anyone can open', async () => {
    findMock.mockResolvedValue({
      docs: [
        gallery(1),
        gallery(2, { isPasswordProtected: true }),
        gallery(3, { expiresAt: PAST }),
        gallery(4, { expiresAt: FUTURE }),
      ],
    })

    const res = await GET(new NextRequest('https://tynnellhollinsphotography.com/api/portfolio-albums?category=weddings'))
    const { albums } = await res.json()

    expect(albums.map((a: { slug: string }) => a.slug)).toEqual(['gallery-1', 'gallery-4'])
    // Drafts are still excluded at the query level.
    expect(findMock.mock.calls[0][0].where).toEqual({
      and: [{ category: { equals: 'weddings' } }, { status: { not_equals: 'draft' } }],
    })
  })
})
