import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendMock = vi.fn()
const findGlobalMock = vi.fn()
const safeLimitMock = vi.fn()

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ findGlobal: findGlobalMock }),
}))

vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('@/app/lib/ratelimit', () => ({
  contactRatelimit: {},
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
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-123-4567',
    contactPreference: 'Email',
    sessionType: 'Wedding',
    date: futureDate(10),
    location: 'Albuquerque, NM',
    message: 'We would love to book a session!',
    howHeard: 'Instagram',
    ...overrides,
  }
}

function makeRequest(body: Record<string, unknown>, origin: string | null = ALLOWED_ORIGIN): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (origin) headers.origin = origin
  return new Request('https://tynnellhollinsphotography.com/api/contact', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CONTACT_TO_EMAIL = 'hello@tynnellhollinsphotography.com'
  safeLimitMock.mockResolvedValue({ success: true })
  findGlobalMock.mockImplementation(({ slug }: { slug: string }) => {
    if (slug === 'booking-settings') return Promise.resolve({ minLeadTimeHours: 48, maxBookingMonths: 24 })
    if (slug === 'availability') return Promise.resolve({ blockedRanges: [] })
    return Promise.resolve(null)
  })
  sendMock.mockResolvedValue({ data: { id: 'email_123' }, error: null })
})

describe('POST /api/contact - happy paths', () => {
  it('sends both emails and returns success for a valid submission', async () => {
    const res = await POST(makeRequest(validBody()))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ success: true })
    expect(sendMock).toHaveBeenCalledTimes(2)
  })

  it('includes the OOO message in the acknowledgment email during an active OOO period', async () => {
    findGlobalMock.mockImplementation(({ slug }: { slug: string }) => {
      if (slug === 'booking-settings') return Promise.resolve({ minLeadTimeHours: 48, maxBookingMonths: 24 })
      if (slug === 'availability') {
        const start = futureDate(-2)
        const end = futureDate(2)
        return Promise.resolve({
          blockedRanges: [{ startDate: start, endDate: end, applyReturnBuffer: false, customerMessage: 'Away until {returnDate}.' }],
        })
      }
      return Promise.resolve(null)
    })

    const res = await POST(makeRequest(validBody({ date: futureDate(10) })))
    expect(res.status).toBe(200)

    const ackCall = sendMock.mock.calls.find(call => call[0].subject.startsWith('Got your inquiry'))
    expect(ackCall?.[0].html).toContain('Away until')
  })
})

describe('POST /api/contact - sad paths', () => {
  it('rejects a request with a missing or disallowed origin', async () => {
    const res = await POST(makeRequest(validBody(), 'https://evil.example.com'))
    expect(res.status).toBe(403)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects a request with no origin header at all', async () => {
    const res = await POST(makeRequest(validBody(), null))
    expect(res.status).toBe(403)
  })

  it('returns 429 when rate limited', async () => {
    safeLimitMock.mockResolvedValue({ success: false })
    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(429)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects a submission missing required fields', async () => {
    const res = await POST(makeRequest(validBody({ name: '' })))
    expect(res.status).toBe(400)
  })

  it('rejects a field that exceeds its maximum length', async () => {
    const res = await POST(makeRequest(validBody({ message: 'a'.repeat(6000) })))
    expect(res.status).toBe(400)
  })

  it('rejects an invalid email address', async () => {
    const res = await POST(makeRequest(validBody({ email: 'not-an-email' })))
    expect(res.status).toBe(400)
  })

  it('rejects an invalid phone number', async () => {
    const res = await POST(makeRequest(validBody({ phone: '123' })))
    expect(res.status).toBe(400)
  })

  it('rejects a date before the minimum lead time', async () => {
    const res = await POST(makeRequest(validBody({ date: futureDate(1) })))
    expect(res.status).toBe(400)
  })

  it('rejects a date that falls within a blocked range', async () => {
    findGlobalMock.mockImplementation(({ slug }: { slug: string }) => {
      if (slug === 'booking-settings') return Promise.resolve({ minLeadTimeHours: 48, maxBookingMonths: 24 })
      if (slug === 'availability') {
        return Promise.resolve({
          blockedRanges: [{ startDate: futureDate(5), endDate: futureDate(15), applyReturnBuffer: false }],
        })
      }
      return Promise.resolve(null)
    })

    const res = await POST(makeRequest(validBody({ date: futureDate(10) })))
    expect(res.status).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('returns 500 when CONTACT_TO_EMAIL is not configured', async () => {
    delete process.env.CONTACT_TO_EMAIL
    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(500)
  })

  it('returns 500 when the inquiry email fails to send', async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: 'Resend API error' } })
    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(500)
  })

  it('still returns success when only the acknowledgment email fails (non-fatal)', async () => {
    sendMock
      .mockResolvedValueOnce({ data: { id: 'email_123' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'Resend API error' } })
    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(200)
  })

  it('returns 500 when an unexpected error is thrown', async () => {
    sendMock.mockRejectedValueOnce(new Error('network failure'))
    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(500)
  })
})
