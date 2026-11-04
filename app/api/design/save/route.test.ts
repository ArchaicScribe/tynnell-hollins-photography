import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { SITE_DESIGN_FIELDS } from '@/test/siteDesignFields'

const updateGlobalMock = vi.fn()
const requireAdminUserMock = vi.fn()

vi.mock('@/app/lib/builderAuth', () => ({
  requireAdminUser: (...args: unknown[]) => requireAdminUserMock(...args),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const { POST } = await import('./route')

function makeRequest(body: unknown): Request {
  return new Request('https://tynnellhollinsphotography.com/api/design/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminUserMock.mockResolvedValue({ payload: { updateGlobal: updateGlobalMock }, user: { id: 1, role: 'admin' } })
  updateGlobalMock.mockResolvedValue({})
})

describe('POST /api/design/save', () => {
  it('saves every SiteDesign field the /design editor sends', async () => {
    // The allowlist is the last link of the theme chain. A field missing
    // from it is accepted by the editor, then silently dropped on save.
    const body = Object.fromEntries(SITE_DESIGN_FIELDS.map((f) => [f.name, `value-${f.name}`]))

    const res = await POST(makeRequest(body))

    expect(res.status).toBe(200)
    const saved = updateGlobalMock.mock.calls[0][0]
    expect(saved.slug).toBe('site-design')
    expect(Object.keys(saved.data).sort()).toEqual(SITE_DESIGN_FIELDS.map((f) => f.name).sort())
  })

  it('drops keys that are not SiteDesign fields', async () => {
    const res = await POST(makeRequest({ colorBg: '#E4E2D8', id: 99, updatedAt: '2020-01-01', role: 'admin' }))

    expect(res.status).toBe(200)
    expect(updateGlobalMock).toHaveBeenCalledWith({ slug: 'site-design', data: { colorBg: '#E4E2D8' } })
  })

  it('rejects a body with no SiteDesign fields instead of writing an empty update', async () => {
    const res = await POST(makeRequest({ role: 'admin' }))

    expect(res.status).toBe(400)
    expect(updateGlobalMock).not.toHaveBeenCalled()
  })

  it('refuses a signed-in user who is not an admin', async () => {
    requireAdminUserMock.mockResolvedValue(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))

    const res = await POST(makeRequest({ colorBg: '#ffffff' }))

    expect(res.status).toBe(403)
    expect(updateGlobalMock).not.toHaveBeenCalled()
  })

  it('rejects a body that is not JSON', async () => {
    const res = await POST(makeRequest('{not json'))

    expect(res.status).toBe(400)
    expect(updateGlobalMock).not.toHaveBeenCalled()
  })

  it('reports a failed save rather than claiming success', async () => {
    updateGlobalMock.mockRejectedValue(new Error('column "tape_shadow" does not exist'))

    const res = await POST(makeRequest({ colorBg: '#ffffff' }))

    expect(res.status).toBe(500)
  })
})
