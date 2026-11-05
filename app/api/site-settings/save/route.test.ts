import { describe, it, expect, vi, beforeEach } from 'vitest'

const updateGlobalMock = vi.fn()
const requireAdminUserMock = vi.fn()

vi.mock('@/app/lib/builderAuth', () => ({
  requireAdminUser: (...args: unknown[]) => requireAdminUserMock(...args),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const { POST } = await import('./route')

function makeRequest(body: unknown): Request {
  return new Request('https://tynnellhollinsphotography.com/api/site-settings/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const card = { title: 'The wedding experience', linkLabel: 'Get the details', href: '/services', imageUrl: '' }

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminUserMock.mockResolvedValue({ payload: { updateGlobal: updateGlobalMock }, user: { id: 1, role: 'admin' } })
  updateGlobalMock.mockResolvedValue({})
})

describe('POST /api/site-settings/save, menu cards', () => {
  it('saves the "Work with me" menu cards', async () => {
    const res = await POST(makeRequest({ menuCards: [card] }))

    expect(res.status).toBe(200)
    expect(updateGlobalMock).toHaveBeenCalledWith({ slug: 'site-config', data: { menuCards: [card] } })
  })

  it('cleans the cards before saving, so an unsafe link never reaches the database', async () => {
    await POST(makeRequest({ menuCards: [card, { ...card, title: 'Bad', href: 'javascript:alert(1)' }] }))

    expect(updateGlobalMock.mock.calls[0][0].data.menuCards).toEqual([card])
  })

  it('saves an empty list, which is how Tynnell removes the cards', async () => {
    await POST(makeRequest({ menuCards: [] }))

    expect(updateGlobalMock.mock.calls[0][0].data.menuCards).toEqual([])
  })

  it('still saves the plain text settings alongside the cards', async () => {
    await POST(makeRequest({ title: 'Tynnell Hollins Photography', menuCards: [card] }))

    expect(updateGlobalMock.mock.calls[0][0].data).toEqual({ title: 'Tynnell Hollins Photography', menuCards: [card] })
  })

  it('rejects a request from someone who is not an admin', async () => {
    const { NextResponse } = await import('next/server')
    requireAdminUserMock.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const res = await POST(makeRequest({ menuCards: [card] }))

    expect(res.status).toBe(401)
    expect(updateGlobalMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/site-settings/save, freebie', () => {
  it('saves the freebie title and link', async () => {
    await POST(makeRequest({ freebieTitle: 'The Wedding Planning Guide', freebieUrl: 'https://media.example/guide.pdf' }))

    expect(updateGlobalMock.mock.calls[0][0].data).toEqual({ freebieTitle: 'The Wedding Planning Guide', freebieUrl: 'https://media.example/guide.pdf' })
  })

  it('never stores a freebie link that is not a site page or https, and keeps the one already saved', async () => {
    // Overwriting with an empty link would quietly stop every freebie email.
    await POST(makeRequest({ freebieTitle: 'Guide', freebieUrl: 'javascript:alert(1)' }))

    expect(updateGlobalMock.mock.calls[0][0].data).not.toHaveProperty('freebieUrl')
  })

  it('clears the freebie link when Tynnell empties the box', async () => {
    await POST(makeRequest({ freebieUrl: '' }))

    expect(updateGlobalMock.mock.calls[0][0].data.freebieUrl).toBe('')
  })

  it('trims spaces around the freebie link', async () => {
    await POST(makeRequest({ freebieUrl: '  /guide.pdf ' }))

    expect(updateGlobalMock.mock.calls[0][0].data.freebieUrl).toBe('/guide.pdf')
  })
})
