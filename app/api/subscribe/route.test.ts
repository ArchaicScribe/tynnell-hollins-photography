import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const createContactMock = vi.fn()
const sendMock = vi.fn()
const findGlobalMock = vi.fn()
const safeLimitMock = vi.fn()
const verifyTurnstileMock = vi.fn()
const recipientLimitMock = vi.fn()

vi.mock('resend', () => ({
  Resend: class {
    contacts = { create: createContactMock }
    emails = { send: sendMock }
  },
}))

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ findGlobal: findGlobalMock }),
}))

vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('@/app/lib/ratelimit', () => ({
  subscribeRatelimit: {},
  freebieRecipientRatelimit: { limit: (...args: unknown[]) => recipientLimitMock(...args) },
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  safeLimit: (...args: unknown[]) => safeLimitMock(...args),
}))

vi.mock('@/app/lib/turnstile', () => ({
  verifyTurnstile: (...args: unknown[]) => verifyTurnstileMock(...args),
}))

const { POST } = await import('./route')

const ORIGIN = 'https://tynnellhollinsphotography.com'

function makeRequest(body: Record<string, unknown>, origin: string | null = ORIGIN): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (origin) headers.origin = origin
  return new Request(`${ORIGIN}/api/subscribe`, { method: 'POST', headers, body: JSON.stringify(body) })
}

const originalSegment = process.env.RESEND_SEGMENT_ID

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.RESEND_SEGMENT_ID
  safeLimitMock.mockResolvedValue({ success: true })
  verifyTurnstileMock.mockResolvedValue(true)
  recipientLimitMock.mockResolvedValue({ success: true })
  createContactMock.mockResolvedValue({ data: { id: 'c_1', object: 'contact' }, error: null })
  sendMock.mockResolvedValue({ data: { id: 'e_1' }, error: null })
  findGlobalMock.mockResolvedValue({ freebieTitle: 'The Wedding Planning Guide', freebieUrl: 'https://media.example/guide.pdf' })
})

afterEach(() => {
  if (originalSegment === undefined) delete process.env.RESEND_SEGMENT_ID
  else process.env.RESEND_SEGMENT_ID = originalSegment
})

describe('POST /api/subscribe, adding the subscriber', () => {
  it('adds the visitor to Resend contacts', async () => {
    const res = await POST(makeRequest({ email: 'jane@example.com', firstName: 'Jane', kind: 'newsletter' }))

    expect(res.status).toBe(200)
    expect(createContactMock).toHaveBeenCalledWith({ email: 'jane@example.com', firstName: 'Jane' })
  })

  it('never tells Resend the contact is subscribed, so a form fill cannot undo an unsubscribe', async () => {
    // A new contact is subscribed by default. Sending unsubscribed: false
    // could flip an existing, opted-out contact back on.
    await POST(makeRequest({ email: 'jane@example.com', kind: 'newsletter' }))

    expect(createContactMock.mock.calls[0][0]).not.toHaveProperty('unsubscribed')
  })

  it('ignores a "first name" that is not a name, so it cannot carry a link into an email', async () => {
    await POST(makeRequest({ email: 'jane@example.com', firstName: 'Your account is locked, visit evil.com', kind: 'freebie' }))

    expect(createContactMock.mock.calls[0][0]).not.toHaveProperty('firstName')
    expect(sendMock.mock.calls[0][0].html).not.toContain('evil.com')
  })

  it('keeps real names, including accents, apostrophes and hyphens', async () => {
    await POST(makeRequest({ email: 'jane@example.com', firstName: "Zoë O'Neil-Ruiz", kind: 'newsletter' }))

    expect(createContactMock.mock.calls[0][0].firstName).toBe("Zoë O'Neil-Ruiz")
  })

  it('also files them in the Resend segment when one is configured', async () => {
    process.env.RESEND_SEGMENT_ID = 'seg_123'

    await POST(makeRequest({ email: 'jane@example.com', kind: 'newsletter' }))

    expect(createContactMock.mock.calls[0][0].segments).toEqual([{ id: 'seg_123' }])
  })

  it('treats someone who is already subscribed as a success, without saying so', async () => {
    // Saying "already subscribed" would tell anyone whether an address is on the list.
    createContactMock.mockResolvedValue({ data: null, error: { statusCode: 409, name: 'validation_error', message: 'Contact already exists' } })

    const res = await POST(makeRequest({ email: 'jane@example.com', kind: 'newsletter' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, freebieSent: false })
  })

  it('reports a real Resend failure instead of pretending it worked', async () => {
    createContactMock.mockResolvedValue({ data: null, error: { statusCode: 500, name: 'application_error', message: 'boom' } })

    const res = await POST(makeRequest({ email: 'jane@example.com', kind: 'newsletter' }))

    expect(res.status).toBe(500)
  })

  it('rejects an invalid email address', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email', kind: 'newsletter' }))

    expect(res.status).toBe(400)
    expect(createContactMock).not.toHaveBeenCalled()
  })

  it('rejects a first name long enough to be abuse', async () => {
    const res = await POST(makeRequest({ email: 'jane@example.com', firstName: 'x'.repeat(101), kind: 'newsletter' }))

    expect(res.status).toBe(400)
  })
})

describe('POST /api/subscribe, abuse protection', () => {
  it('refuses requests from other sites', async () => {
    const res = await POST(makeRequest({ email: 'jane@example.com', kind: 'newsletter' }, 'https://evil.example'))

    expect(res.status).toBe(403)
    expect(createContactMock).not.toHaveBeenCalled()
  })

  it('quietly drops a bot that fills the hidden honeypot field', async () => {
    const res = await POST(makeRequest({ email: 'jane@example.com', kind: 'freebie', website: 'spam.example' }))

    expect(res.status).toBe(200)
    expect(createContactMock).not.toHaveBeenCalled()
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('limits how often one visitor can sign up', async () => {
    safeLimitMock.mockResolvedValue({ success: false })

    const res = await POST(makeRequest({ email: 'jane@example.com', kind: 'freebie' }))

    expect(res.status).toBe(429)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects a failed Turnstile check', async () => {
    verifyTurnstileMock.mockResolvedValue(false)

    const res = await POST(makeRequest({ email: 'jane@example.com', kind: 'newsletter', turnstileToken: 'bad' }))

    expect(res.status).toBe(400)
    expect(createContactMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/subscribe, the freebie', () => {
  it('emails the freebie link from Site Settings to the new subscriber', async () => {
    const res = await POST(makeRequest({ email: 'jane@example.com', firstName: 'Jane', kind: 'freebie' }))

    expect(await res.json()).toEqual({ success: true, freebieSent: true })
    const email = sendMock.mock.calls[0][0]
    expect(email.to).toBe('jane@example.com')
    expect(email.subject).toContain('The Wedding Planning Guide')
    expect(email.html).toContain('href="https://media.example/guide.pdf"')
  })

  it('never emails a link sent in the request, only the one in Site Settings', async () => {
    // Otherwise anyone could make this site email any link to any address.
    await POST(makeRequest({ email: 'victim@example.com', kind: 'freebie', freebieUrl: 'https://phish.example' }))

    expect(sendMock.mock.calls[0][0].html).not.toContain('phish.example')
  })

  it('turns a site path into a full link, since an email has no page to be relative to', async () => {
    findGlobalMock.mockResolvedValue({ freebieTitle: 'Guide', freebieUrl: '/guides/wedding.pdf' })

    await POST(makeRequest({ email: 'jane@example.com', kind: 'freebie' }))

    expect(sendMock.mock.calls[0][0].html).toContain('href="https://tynnellhollinsphotography.com/guides/wedding.pdf"')
  })

  it('escapes the first name and title in the email', async () => {
    findGlobalMock.mockResolvedValue({ freebieTitle: '<b>Guide</b>', freebieUrl: 'https://media.example/guide.pdf' })

    await POST(makeRequest({ email: 'jane@example.com', firstName: '<script>x</script>', kind: 'freebie' }))

    const html = sendMock.mock.calls[0][0].html
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<b>Guide</b>')
  })

  it('still signs them up, but sends nothing, while no freebie is set up yet', async () => {
    findGlobalMock.mockResolvedValue({ freebieTitle: '', freebieUrl: '' })

    const res = await POST(makeRequest({ email: 'jane@example.com', kind: 'freebie' }))

    expect(createContactMock).toHaveBeenCalled()
    expect(sendMock).not.toHaveBeenCalled()
    expect(await res.json()).toEqual({ success: true, freebieSent: false })
  })

  it('sends nothing for a stored freebie link that is not a site page or https', async () => {
    findGlobalMock.mockResolvedValue({ freebieTitle: 'Guide', freebieUrl: 'javascript:alert(1)' })

    await POST(makeRequest({ email: 'jane@example.com', kind: 'freebie' }))

    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends no email for a newsletter signup', async () => {
    await POST(makeRequest({ email: 'jane@example.com', kind: 'newsletter' }))

    expect(sendMock).not.toHaveBeenCalled()
  })

  it('still counts the signup when the freebie email fails, and says it was not sent', async () => {
    sendMock.mockResolvedValue({ data: null, error: { statusCode: 500, name: 'application_error', message: 'boom' } })

    const res = await POST(makeRequest({ email: 'jane@example.com', kind: 'freebie' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, freebieSent: false })
  })
})

describe('POST /api/subscribe, one freebie per address', () => {
  it('sends the freebie to an address at most once in a while, however many IPs ask', async () => {
    recipientLimitMock.mockResolvedValue({ success: false })

    const res = await POST(makeRequest({ email: 'victim@example.com', kind: 'freebie' }))

    expect(sendMock).not.toHaveBeenCalled()
    // Same answer as a real signup: nothing tells the caller they were limited.
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, freebieSent: false })
  })

  it('counts an address the same whatever its capitals, and never keys on the raw address', async () => {
    await POST(makeRequest({ email: 'Victim@Example.com', kind: 'freebie' }))
    await POST(makeRequest({ email: 'victim@example.com', kind: 'freebie' }))

    const [first, second] = recipientLimitMock.mock.calls.map(([key]) => key)
    expect(first).toBe(second)
    expect(first).not.toContain('victim')
  })

  it('sends nothing when the limit cannot be checked, rather than risking a flood', async () => {
    recipientLimitMock.mockRejectedValue(new Error('redis down'))

    const res = await POST(makeRequest({ email: 'jane@example.com', kind: 'freebie' }))

    expect(sendMock).not.toHaveBeenCalled()
    expect(await res.json()).toEqual({ success: true, freebieSent: false })
  })

  it('still sends the freebie to someone already on the list who asks for it', async () => {
    createContactMock.mockResolvedValue({ data: null, error: { statusCode: 409, name: 'validation_error', message: 'Contact already exists' } })

    await POST(makeRequest({ email: 'jane@example.com', kind: 'freebie' }))

    expect(sendMock).toHaveBeenCalled()
  })

  it('tells a recipient who did not sign up how to get off the list', async () => {
    await POST(makeRequest({ email: 'jane@example.com', kind: 'freebie' }))

    expect(sendMock.mock.calls[0][0].html).toMatch(/didn(?:&rsquo;|')t sign up/i)
  })

  it('checks the visitor IP and Turnstile token it was given', async () => {
    await POST(makeRequest({ email: 'jane@example.com', kind: 'newsletter', turnstileToken: 'tok' }))

    expect(safeLimitMock).toHaveBeenCalledWith(expect.anything(), '127.0.0.1')
    expect(verifyTurnstileMock).toHaveBeenCalledWith('tok', '127.0.0.1')
  })
})