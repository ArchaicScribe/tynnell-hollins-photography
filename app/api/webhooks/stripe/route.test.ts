import { describe, it, expect, vi, beforeEach } from 'vitest'

process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake'
process.env.CONTACT_TO_EMAIL = 'hello@tynnellhollinsphotography.com'

const constructEventMock = vi.fn()
const sendMock = vi.fn()
const findGlobalMock = vi.fn()

vi.mock('stripe', () => ({
  default: class {
    webhooks = { constructEvent: constructEventMock }
  },
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ findGlobal: findGlobalMock }),
}))

vi.mock('@payload-config', () => ({ default: {} }))

const { POST } = await import('./route')

function makeRequest(body: string, signature: string | null = 't=1,v1=fake'): Request {
  const headers: Record<string, string> = {}
  if (signature) headers['stripe-signature'] = signature
  return new Request('https://tynnellhollinsphotography.com/api/webhooks/stripe', {
    method: 'POST',
    headers,
    body,
  })
}

function paidSessionEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        payment_status: 'paid',
        amount_total: 50000,
        customer_email: 'jane@example.com',
        metadata: {
          clientName: 'Jane Doe',
          clientEmail: 'jane@example.com',
          packageName: 'Wedding Package',
          sessionDate: '2026-08-15',
        },
        ...overrides,
      },
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  findGlobalMock.mockResolvedValue({ blockedRanges: [] })
  sendMock.mockResolvedValue({ data: { id: 'email_123' }, error: null })
})

describe('POST /api/webhooks/stripe - happy path', () => {
  it('sends notification and receipt emails for a paid checkout session', async () => {
    constructEventMock.mockReturnValue(paidSessionEvent())
    const res = await POST(makeRequest('{}'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ received: true })
    expect(sendMock).toHaveBeenCalledTimes(2)
  })
})

describe('POST /api/webhooks/stripe - sad paths', () => {
  it('rejects a request with no stripe-signature header', async () => {
    const res = await POST(makeRequest('{}', null))
    expect(res.status).toBe(400)
    expect(constructEventMock).not.toHaveBeenCalled()
  })

  it('rejects a request with an invalid signature', async () => {
    constructEventMock.mockImplementation(() => { throw new Error('invalid signature') })
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('does not send emails for an unpaid session (guards against unpaid checkout.session.completed)', async () => {
    constructEventMock.mockReturnValue(paidSessionEvent({ payment_status: 'unpaid' }))
    const res = await POST(makeRequest('{}'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ received: true })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('ignores event types other than checkout.session.completed', async () => {
    constructEventMock.mockReturnValue({ type: 'payment_intent.created', data: { object: {} } })
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('still returns 200 when the notification email to Tynnell fails (non-fatal)', async () => {
    constructEventMock.mockReturnValue(paidSessionEvent())
    sendMock
      .mockResolvedValueOnce({ data: null, error: { message: 'Resend API error' } })
      .mockResolvedValueOnce({ data: { id: 'email_456' }, error: null })
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
  })

  it('skips the client receipt email when no valid client email is available', async () => {
    constructEventMock.mockReturnValue(
      paidSessionEvent({ customer_email: null, metadata: { clientName: 'Jane Doe', packageName: 'Wedding Package' } }),
    )
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    // Only the internal notification email should have been attempted.
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('still returns 200 even if the availability lookup throws (non-fatal)', async () => {
    constructEventMock.mockReturnValue(paidSessionEvent())
    findGlobalMock.mockRejectedValue(new Error('DB unreachable'))
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    expect(sendMock).toHaveBeenCalledTimes(2)
  })
})
