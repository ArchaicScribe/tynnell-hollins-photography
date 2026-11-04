import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

process.env.PAYLOAD_SECRET = 'test-secret'

const findMock = vi.fn()
const findByIDMock = vi.fn()
const safeLimitMock = vi.fn()

// Cookies the simulated browser sends with the download request.
let requestCookies: Record<string, string> = {}

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ find: findMock, findByID: findByIDMock }),
}))

vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name in requestCookies ? { name, value: requestCookies[name] } : undefined),
  }),
}))

vi.mock('@upstash/redis', () => ({ Redis: { fromEnv: () => ({}) } }))
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow() { return {} }
  },
}))
vi.mock('@/app/lib/ratelimit', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  safeLimit: (...args: unknown[]) => safeLimitMock(...args),
}))

const { GET: download } = await import('./route')
const { POST: galleryAuth } = await import('@/app/api/gallery-auth/route')

const SLUG = 'smith-wedding'
const PASSWORD = 'correct horse'
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4)
const PHOTO_ID = 42

function protectedGallery(overrides: Record<string, unknown> = {}) {
  return {
    slug: SLUG,
    status: 'published',
    allowDownload: true,
    isPasswordProtected: true,
    password: PASSWORD_HASH,
    expiresAt: null,
    photos: [{ photo: PHOTO_ID }],
    ...overrides,
  }
}

// RFC 6265 section 5.1.4 path-match: what a browser uses to decide whether a
// cookie goes out with a request.
function pathMatches(requestPath: string, cookiePath: string): boolean {
  if (requestPath === cookiePath) return true
  if (!requestPath.startsWith(cookiePath)) return false
  return cookiePath.endsWith('/') || requestPath[cookiePath.length] === '/'
}

async function signIn() {
  const res = await galleryAuth(new NextRequest('https://tynnellhollinsphotography.com/api/gallery-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, password: PASSWORD }),
  }))
  expect(res.status).toBe(200)
  const cookie = res.cookies.get(`gauth_${SLUG}`)
  expect(cookie).toBeDefined()
  return cookie!
}

function downloadRequest() {
  return new NextRequest(`https://tynnellhollinsphotography.com/api/photos/${PHOTO_ID}/download?gallery=${SLUG}`)
}

const params = { params: Promise.resolve({ id: String(PHOTO_ID) }) }

beforeEach(() => {
  findMock.mockReset()
  findByIDMock.mockReset()
  safeLimitMock.mockReset().mockResolvedValue({ success: true })
  requestCookies = {}
  findMock.mockResolvedValue({ docs: [protectedGallery()] })
  findByIDMock.mockResolvedValue({ id: PHOTO_ID, filename: 'first-dance.jpg', url: 'https://media.example/first-dance.jpg' })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response('jpeg-bytes', { headers: { 'content-type': 'image/jpeg' } }),
  ))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('protected gallery download auth', () => {
  it('sets the gallery cookie on a path the download route receives', async () => {
    const cookie = await signIn()
    const downloadPath = downloadRequest().nextUrl.pathname

    expect(cookie.path).toBe('/')
    expect(pathMatches(downloadPath, cookie.path!)).toBe(true)
    // The gallery page itself must still receive it.
    expect(pathMatches(`/portfolio/${SLUG}`, cookie.path!)).toBe(true)
  })

  it('serves the photo when the browser sends the cookie from sign-in', async () => {
    const cookie = await signIn()
    if (pathMatches(downloadRequest().nextUrl.pathname, cookie.path!)) {
      requestCookies[cookie.name] = cookie.value
    }

    const res = await download(downloadRequest(), params)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="first-dance.jpg"')
    expect(await res.text()).toBe('jpeg-bytes')
  })

  it('rejects a download with no gallery cookie', async () => {
    const res = await download(downloadRequest(), params)
    expect(res.status).toBe(401)
  })

  it('rejects a cookie minted for a different password', async () => {
    const cookie = await signIn()
    requestCookies[cookie.name] = cookie.value
    findMock.mockResolvedValue({ docs: [protectedGallery({ password: bcrypt.hashSync('rotated', 4) })] })

    const res = await download(downloadRequest(), params)
    expect(res.status).toBe(401)
  })

  it('refuses a photo that is not in the gallery even with a valid cookie', async () => {
    const cookie = await signIn()
    requestCookies[cookie.name] = cookie.value
    findMock.mockResolvedValue({ docs: [protectedGallery({ photos: [{ photo: 7 }] })] })

    const res = await download(downloadRequest(), params)
    expect(res.status).toBe(404)
  })
})
