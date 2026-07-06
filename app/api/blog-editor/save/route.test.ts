import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

const updateMock = vi.fn()
const requireBuilderUserMock = vi.fn()

vi.mock('@/app/lib/builderAuth', () => ({
  requireBuilderUser: (...args: unknown[]) => requireBuilderUserMock(...args),
}))

const { POST } = await import('./route')

function makeRequest(body: unknown): Request {
  return new Request('https://tynnellhollinsphotography.com/api/blog-editor/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  requireBuilderUserMock.mockResolvedValue({ payload: { update: updateMock } })
  updateMock.mockResolvedValue({ id: 1, slug: 'a-post' })
})

describe('POST /api/blog-editor/save - auth', () => {
  it('returns 401 when not authenticated', async () => {
    requireBuilderUserMock.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    const res = await POST(makeRequest({ id: 1, patch: { title: 'Hi' } }))
    expect(res.status).toBe(401)
    expect(updateMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/blog-editor/save - validation', () => {
  it('rejects a missing post id', async () => {
    const res = await POST(makeRequest({ patch: { title: 'Hi' } }))
    expect(res.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('rejects when there is nothing to save', async () => {
    const res = await POST(makeRequest({ id: 1, patch: {} }))
    expect(res.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('rejects invalid JSON', async () => {
    const res = await POST(new Request('https://tynnellhollinsphotography.com/api/blog-editor/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    }))
    expect(res.status).toBe(400)
  })

  it('drops fields not in the allowed list', async () => {
    await POST(makeRequest({ id: 1, patch: { title: 'Hi', status: 'published', notAField: true } }))
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      data: { title: 'Hi' },
    }))
  })
})

describe('POST /api/blog-editor/save - happy path', () => {
  it('saves a patch without touching status', async () => {
    const res = await POST(makeRequest({ id: 1, patch: { title: 'Updated Title' } }))
    expect(res.status).toBe(200)
    expect(updateMock).toHaveBeenCalledWith({
      collection: 'posts',
      id: 1,
      data: { title: 'Updated Title' },
    })
  })

  it('sets status to published when publish is true', async () => {
    const res = await POST(makeRequest({ id: 1, patch: { title: 'Updated Title' }, publish: true }))
    expect(res.status).toBe(200)
    expect(updateMock).toHaveBeenCalledWith({
      collection: 'posts',
      id: 1,
      data: { title: 'Updated Title', status: 'published' },
    })
  })

  it('allows publish with no other field changes', async () => {
    const res = await POST(makeRequest({ id: 1, patch: {}, publish: true }))
    expect(res.status).toBe(200)
    expect(updateMock).toHaveBeenCalledWith({
      collection: 'posts',
      id: 1,
      data: { status: 'published' },
    })
  })

  it('returns 500 when the update throws', async () => {
    updateMock.mockRejectedValue(new Error('DB down'))
    const res = await POST(makeRequest({ id: 1, patch: { title: 'x' } }))
    expect(res.status).toBe(500)
  })
})
