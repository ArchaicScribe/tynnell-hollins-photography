import { describe, it, expect, vi, beforeEach } from 'vitest'

process.env.STRIPE_SECRET_KEY = 'sk_test_fake'

const createSessionMock = vi.fn()
const findGlobalMock = vi.fn()
const findMock = vi.fn()
const safeLimitMock = vi.fn()

vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create: createSessionMock } }
  },
}))

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ findGlobal: findGlobalMock, find: findMock }),
}))

vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('@/app/lib/ratelimit', () => ({
  checkoutRatelimit: {},
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  safeLimit: (...args: unknown[]) => safeLimitMock(...args),
}))

const { POST } = await import('./route')

const ALLOWED_ORIGIN = 'https://tynnellhollinsphotography.com'

function futureDate(daysFromNow: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    packageName: 'Wedding Package',
    depositAmount: 500,
    clientName: 'Jane Doe',
    clientEmail: 'jane@example.com',
    sessionDate: futureDate(10),
    ...overrides,
  }
}

function makeRequest(body: Record<string, unknown>, origin: string | null = ALLOWED_ORIGIN): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (origin) headers.origin = origin
  return new Request('https://tynnellhollinsphotography.com/api/checkout', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  safeLimitMock.mockResolvedValue({ success: true })
  findGlobalMock.mockImplementation(({ slug }: { slug: string }) => {
    if (slug === 'booking-settings') return Promise.resolve({ minLeadTimeHours: 48, maxBookingMonths: 24 })
    if (slug === 'availability') return Promise.resolve({ blockedRanges: [] })
    return Promise.resolve(null)
  })
  findMock.mockResolvedValue({ docs: [{ id: 1, title: 'Wedding Package', depositAmount: 500 }] })
  createSessionMock.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test_123' })
})

describe('POST /api/checkout - happy path', () => {
  it('creates a Stripe session for a valid, recognized package', async () => {
    const res = await POST(makeRequest(validBody()))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.url).toBe('https://checkout.stripe.com/pay/cs_test_123')
    expect(createSessionMock).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/checkout - sad paths', () => {
  it('rejects a disallowed origin', async () => {
    const res = await POST(makeRequest(validBody(), 'https://evil.example.com'))
    expect(res.status).toBe(403)
    expect(createSessionMock).not.toHaveBeenCalled()
  })

  it('returns 429 when rate limited', async () => {
    safeLimitMock.mockResolvedValue({ success: false })
    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(429)
  })

  it('rejects a request missing required fields', async () => {
    const res = await POST(makeRequest(validBody({ packageName: '' })))
    expect(res.status).toBe(400)
  })

  it('rejects non-string field types', async () => {
    const res = await POST(makeRequest(validBody({ clientName: 12345 })))
    expect(res.status).toBe(400)
  })

  it('rejects a field exceeding the maximum length', async () => {
    const res = await POST(makeRequest(validBody({ packageName: 'a'.repeat(300) })))
    expect(res.status).toBe(400)
  })

  it('rejects a non-positive deposit amount', async () => {
    const res = await POST(makeRequest(validBody({ depositAmount: 0 })))
    expect(res.status).toBe(400)
  })

  it('rejects an invalid client email', async () => {
    const res = await POST(makeRequest(validBody({ clientEmail: 'not-an-email' })))
    expect(res.status).toBe(400)
  })

  it('rejects a session date before the minimum lead time', async () => {
    const res = await POST(makeRequest(validBody({ sessionDate: futureDate(1) })))
    expect(res.status).toBe(400)
  })

  it('rejects a session date inside a blocked range', async () => {
    findGlobalMock.mockImplementation(({ slug }: { slug: string }) => {
      if (slug === 'booking-settings') return Promise.resolve({ minLeadTimeHours: 48, maxBookingMonths: 24 })
      if (slug === 'availability') {
        return Promise.resolve({ blockedRanges: [{ startDate: futureDate(5), endDate: futureDate(15), applyReturnBuffer: false }] })
      }
      return Promise.resolve(null)
    })
    const res = await POST(makeRequest(validBody({ sessionDate: futureDate(10) })))
    expect(res.status).toBe(400)
  })

  it('rejects an unrecognized package name (not in Payload)', async () => {
    findMock.mockResolvedValue({ docs: [] })
    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(400)
  })

  it('rejects a deposit amount that does not match the canonical Payload price', async () => {
    findMock.mockResolvedValue({ docs: [{ id: 1, title: 'Wedding Package', depositAmount: 750 }] })
    const res = await POST(makeRequest(validBody({ depositAmount: 1 })))
    expect(res.status).toBe(400)
    expect(createSessionMock).not.toHaveBeenCalled()
  })

  it('returns 500 when Stripe session creation throws', async () => {
    createSessionMock.mockRejectedValue(new Error('Stripe API down'))
    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(500)
  })
})
