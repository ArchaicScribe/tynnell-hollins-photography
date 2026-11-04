import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const findMock = vi.fn()

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ find: findMock }),
}))

vi.mock('@payload-config', () => ({ default: {} }))

const { GET } = await import('./route')

const PAST = '2020-01-01T00:00:00.000Z'

function photo(id: number) {
  return { id, title: `Photo ${id}`, url: `https://media.example/${id}.jpg`, alt: null, caption: null }
}

function request(category: string) {
  return new NextRequest(`https://tynnellhollinsphotography.com/api/portfolio-photos?category=${category}`)
}

beforeEach(() => {
  findMock.mockReset()
})

describe('GET /api/portfolio-photos', () => {
  it('excludes photos that only live in draft, protected, or expired galleries', async () => {
    findMock.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === 'galleries') {
        return {
          docs: [
            { status: 'published', isPasswordProtected: true, expiresAt: null, photos: [{ photo: 1 }] },
            { status: 'draft', isPasswordProtected: false, expiresAt: null, photos: [{ photo: 2 }] },
            { status: 'published', isPasswordProtected: false, expiresAt: PAST, photos: [{ photo: 3 }] },
            { status: 'published', isPasswordProtected: false, expiresAt: null, photos: [{ photo: 4 }] },
          ],
        }
      }
      return { docs: [photo(4), photo(5)] }
    })

    const res = await GET(request('all'))
    const body = await res.json()

    const photosCall = findMock.mock.calls.find(([args]) => args.collection === 'photos')?.[0]
    expect(photosCall.where).toEqual({
      and: [
        { category: { in: ['weddings', 'portraits', 'families', 'couples', 'brands'] } },
        { id: { not_in: [1, 2, 3] } },
      ],
    })
    expect(body.photos.map((p: { id: string }) => p.id)).toEqual(['4', '5'])
  })

  it('leaves the category query untouched when no gallery is private', async () => {
    findMock.mockImplementation(async ({ collection }: { collection: string }) =>
      collection === 'galleries'
        ? { docs: [{ status: 'published', isPasswordProtected: false, expiresAt: null, photos: [{ photo: 1 }] }] }
        : { docs: [photo(1)] },
    )

    await GET(request('weddings'))

    const photosCall = findMock.mock.calls.find(([args]) => args.collection === 'photos')?.[0]
    expect(photosCall.where).toEqual({ category: { equals: 'weddings' } })
  })

  it('returns nothing for an unknown category without querying', async () => {
    const res = await GET(request('secret'))
    expect(await res.json()).toEqual({ photos: [] })
    expect(findMock).not.toHaveBeenCalled()
  })
})
