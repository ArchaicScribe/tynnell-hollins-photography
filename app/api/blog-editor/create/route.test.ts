import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

const createMock = vi.fn()
const requireBuilderUserMock = vi.fn()

vi.mock('@/app/lib/builderAuth', () => ({
  requireBuilderUser: (...args: unknown[]) => requireBuilderUserMock(...args),
}))

const { POST } = await import('./route')

beforeEach(() => {
  vi.clearAllMocks()
  requireBuilderUserMock.mockResolvedValue({ payload: { create: createMock } })
  createMock.mockResolvedValue({ id: 1, slug: 'untitled-123' })
})

describe('POST /api/blog-editor/create', () => {
  it('returns 401 when not authenticated', async () => {
    requireBuilderUserMock.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    const res = await POST()
    expect(res.status).toBe(401)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('creates a draft placeholder post and returns its slug', async () => {
    const res = await POST()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.slug).toBe('untitled-123')
    expect(createMock).toHaveBeenCalledWith({
      collection: 'posts',
      data: expect.objectContaining({ title: 'Untitled Post', status: 'draft' }),
    })
  })

  it('returns 500 when creation throws', async () => {
    createMock.mockRejectedValue(new Error('DB down'))
    const res = await POST()
    expect(res.status).toBe(500)
  })
})
