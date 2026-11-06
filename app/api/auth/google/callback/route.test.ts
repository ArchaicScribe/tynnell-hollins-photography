import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const findMock = vi.fn()
const updateOneMock = vi.fn()

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({
  getPayload: async () => ({ find: findMock, db: { updateOne: updateOneMock }, secret: 'a'.repeat(32) }),
}))

const { GET } = await import('./route')

const env = { ...process.env }
const fetchMock = vi.fn()

// Google's token endpoint, then its tokeninfo endpoint.
function google({ email = 'someone.new@gmail.com', verified = 'true', aud = 'client-id' } = {}) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url.startsWith('https://oauth2.googleapis.com/tokeninfo')) {
      return { ok: true, json: async () => ({ email, email_verified: verified, aud }) }
    }
    return { ok: true, json: async () => ({ id_token: 'id-token' }) }
  })
}

function callback({ state = 'state-1', cookie = 'state-1' } = {}) {
  return new NextRequest(`https://www.tynnellhollinsphotography.com/api/auth/google/callback?code=c&state=${state}`, {
    headers: cookie ? { cookie: `google_oauth_state=${cookie}` } : {},
  })
}

function ssoError(res: Response) {
  return new URL(res.headers.get('location')!).searchParams.get('sso_error')
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  process.env.GOOGLE_CLIENT_ID = 'client-id'
  process.env.GOOGLE_CLIENT_SECRET = 'secret'
  delete process.env.APP_URL
  findMock.mockResolvedValue({ docs: [] })
  updateOneMock.mockResolvedValue({})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  process.env = { ...env }
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('GET /api/auth/google/callback', () => {
  it('signs in any existing user whose verified Google email matches, with no hard-coded list', async () => {
    google({ email: 'someone.new@gmail.com' })
    findMock.mockResolvedValue({ docs: [{ id: 7, email: 'someone.new@gmail.com', role: 'editor' }] })

    const res = await GET(callback())

    expect(res.headers.get('location')).toBe('https://www.tynnellhollinsphotography.com/admin')
    expect(res.cookies.get('payload-token')?.value).toBeTruthy()
    expect(updateOneMock).toHaveBeenCalledWith(expect.objectContaining({ id: 7, collection: 'users' }))
  })

  it('looks the user up by the lower-cased email, however Google capitalises it', async () => {
    google({ email: 'Hello@TynnellHollinsPhotography.com' })
    findMock.mockResolvedValue({ docs: [{ id: 1, email: 'hello@tynnellhollinsphotography.com', role: 'admin' }] })

    const res = await GET(callback())

    expect(res.cookies.get('payload-token')?.value).toBeTruthy()
    expect(findMock).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'users',
      where: { email: { equals: 'hello@tynnellhollinsphotography.com' } },
    }))
  })

  it('turns away a Google account that has no user on the site', async () => {
    google({ email: 'stranger@gmail.com' })

    const res = await GET(callback())

    expect(ssoError(res)).toBe('user_not_found')
    expect(res.cookies.get('payload-token')).toBeUndefined()
    expect(updateOneMock).not.toHaveBeenCalled()
  })

  it('turns away an email Google has not verified, without looking for a user', async () => {
    google({ verified: 'false' })

    const res = await GET(callback())

    expect(ssoError(res)).toBe('invalid_token')
    expect(findMock).not.toHaveBeenCalled()
  })

  it('turns away a token issued to a different app', async () => {
    google({ aud: 'someone-elses-client' })

    const res = await GET(callback())

    expect(ssoError(res)).toBe('invalid_token')
    expect(findMock).not.toHaveBeenCalled()
  })

  it.each([
    ['the state does not match', { state: 'state-1', cookie: 'other' }],
    ['the state cookie is missing', { state: 'state-1', cookie: '' }],
  ])('sends a plain "interrupted" error the login page understands when %s', async (_, request) => {
    google()

    const res = await GET(callback(request))

    expect(ssoError(res)).toBe('invalid_state')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
