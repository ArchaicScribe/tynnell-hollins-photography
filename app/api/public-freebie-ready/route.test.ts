import { describe, it, expect, vi, beforeEach } from 'vitest'

const findGlobalMock = vi.fn()

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ findGlobal: (...a: unknown[]) => findGlobalMock(...a) }),
}))
vi.mock('@payload-config', () => ({ default: {} }))

import { GET } from './route'

describe('GET /api/public-freebie-ready', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findGlobalMock.mockResolvedValue({ freebieUrl: '' })
  })

  it('reports ready when a guide link is set', async () => {
    findGlobalMock.mockResolvedValue({ freebieUrl: 'https://example.com/guide.pdf' })

    expect(await (await GET()).json()).toEqual({ ready: true })
  })

  it('reports not ready when the link is blank, whitespace or unsafe', async () => {
    for (const freebieUrl of ['', '   ', undefined, 'javascript:alert(1)']) {
      findGlobalMock.mockResolvedValue({ freebieUrl })
      expect(await (await GET()).json()).toEqual({ ready: false })
    }
  })

  it('reports not ready, with status 200, when reading the settings throws', async () => {
    findGlobalMock.mockRejectedValue(new Error('db down'))

    const res = await GET()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ready: false })
  })

  it('never includes the link in the response body', async () => {
    findGlobalMock.mockResolvedValue({ freebieUrl: 'https://example.com/secret-guide.pdf' })

    expect(JSON.stringify(await (await GET()).json())).not.toContain('secret-guide')
  })
})
