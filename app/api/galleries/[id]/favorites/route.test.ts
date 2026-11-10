import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

type Row = Record<string, unknown> & { id: number }
let gallery: Row | null
let lists: Row[]
let signedIn: boolean

const fakePayload = {
  findByID: vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
    const row = collection === 'galleries' ? (gallery?.id === id ? gallery : null) : lists.find(l => l.id === id)
    if (!row) throw new Error('Not Found')
    return row
  }),
  find: vi.fn(async ({ where }: { where: { gallery: { equals: number } } }) => ({
    docs: lists.filter(l => l.gallery === where.gallery.equals),
  })),
  delete: vi.fn(async ({ id }: { id: number }) => {
    lists = lists.filter(l => l.id !== id)
  }),
}

vi.mock('@/app/lib/builderAuth', () => ({
  requireBuilderUser: async () =>
    signedIn ? { payload: fakePayload } : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
}))

const { GET, DELETE } = await import('./route')

const url = (query = '') => `https://tynnellhollinsphotography.com/api/galleries/5/favorites${query}`
const params = (id = '5') => ({ params: Promise.resolve({ id }) })
const get = (id?: string) => GET(new NextRequest(url()), params(id))
const del = (listId: number | string, id?: string) =>
  DELETE(new NextRequest(url(`?list=${listId}`), { method: 'DELETE' }), params(id))

beforeEach(() => {
  signedIn = true
  gallery = { id: 5, photos: [{ photo: 1 }, { photo: 2 }, { photo: 3 }] }
  lists = [
    { id: 1, gallery: 5, clientName: 'Jane Smith', clientEmail: 'jane@example.com', photoIds: [3, 99, 1], sentAt: '2026-11-08T10:00:00.000Z', sentPhotoIds: [1, 3], updatedAt: '2026-11-08T10:00:00.000Z' },
    { id: 2, gallery: 5, clientName: 'John Smith', clientEmail: 'john@example.com', photoIds: [2], sentAt: null, sentPhotoIds: null, updatedAt: '2026-11-09T10:00:00.000Z' },
    { id: 3, gallery: 6, clientName: 'Other', clientEmail: 'other@example.com', photoIds: [1], sentAt: null, updatedAt: '2026-11-09T12:00:00.000Z' },
  ]
  vi.clearAllMocks()
})

describe('GET /api/galleries/[id]/favorites', () => {
  it('is for signed-in studio users only', async () => {
    signedIn = false
    expect((await get()).status).toBe(401)
  })

  it("lists each client's favorites for this gallery, most recent activity first", async () => {
    const res = await get()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      lists: [
        { id: 2, clientName: 'John Smith', clientEmail: 'john@example.com', photoIds: [2], sentAt: null, unsentChanges: true, updatedAt: '2026-11-09T10:00:00.000Z' },
        // 99 has left the gallery, so it is not shown; order follows the gallery.
        { id: 1, clientName: 'Jane Smith', clientEmail: 'jane@example.com', photoIds: [1, 3], sentAt: '2026-11-08T10:00:00.000Z', unsentChanges: false, updatedAt: '2026-11-08T10:00:00.000Z' },
      ],
    })
  })

  it('reports an unknown gallery as not found', async () => {
    expect((await get('77')).status).toBe(404)
    expect((await get('abc')).status).toBe(400)
  })
})

describe('DELETE /api/galleries/[id]/favorites', () => {
  it('is for signed-in studio users only', async () => {
    signedIn = false
    expect((await del(1)).status).toBe(401)
    expect(lists).toHaveLength(3)
  })

  it("deletes one client's list", async () => {
    expect((await del(1)).status).toBe(200)
    expect(lists.map(l => l.id)).toEqual([2, 3])
  })

  it('refuses a list that belongs to a different gallery', async () => {
    expect((await del(3)).status).toBe(404)
    expect(lists).toHaveLength(3)
  })

  it('rejects a missing or malformed list id', async () => {
    expect((await del('abc')).status).toBe(400)
    expect(lists).toHaveLength(3)
  })
})
