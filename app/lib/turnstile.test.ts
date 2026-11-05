import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { verifyTurnstile } from './turnstile'

const original = process.env.TURNSTILE_SECRET_KEY

describe('verifyTurnstile', () => {
  beforeEach(() => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'
  })
  afterEach(() => {
    if (original === undefined) delete process.env.TURNSTILE_SECRET_KEY
    else process.env.TURNSTILE_SECRET_KEY = original
    vi.unstubAllGlobals()
  })

  it('lets everything through while no Turnstile widget is set up (no secret key)', async () => {
    delete process.env.TURNSTILE_SECRET_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await verifyTurnstile(undefined, '1.2.3.4')).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails a request with no token once a widget is set up', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await verifyTurnstile('', '1.2.3.4')).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('asks Cloudflare and passes when it says the token is good', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ success: true }) })
    vi.stubGlobal('fetch', fetchMock)

    expect(await verifyTurnstile('good-token', '1.2.3.4')).toBe(true)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    const sent = new URLSearchParams(init.body)
    expect(sent.get('secret')).toBe('test-secret')
    expect(sent.get('response')).toBe('good-token')
    expect(sent.get('remoteip')).toBe('1.2.3.4')
  })

  it('fails when Cloudflare rejects the token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({ success: false }) }))

    expect(await verifyTurnstile('bad-token', '1.2.3.4')).toBe(false)
  })

  it('fails closed when Cloudflare cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    expect(await verifyTurnstile('some-token', '1.2.3.4')).toBe(false)
  })
})
