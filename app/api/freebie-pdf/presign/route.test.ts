import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextResponse } from 'next/server'

const requireAdminUserMock = vi.fn()
const getSignedUrlMock = vi.fn()

vi.mock('@/app/lib/builderAuth', () => ({
  requireAdminUser: (...args: unknown[]) => requireAdminUserMock(...args),
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => getSignedUrlMock(...args),
}))

const { POST } = await import('./route')
const { MAX_FREEBIE_PDF_BYTES } = await import('@/app/lib/freebiePdf')
const { uploadedFreebieKey } = await import('@/app/lib/r2')

function makeRequest(body: unknown): Request {
  return new Request('https://tynnellhollinsphotography.com/api/freebie-pdf/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const env = { ...process.env }

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminUserMock.mockResolvedValue({ payload: {}, user: { id: 1, role: 'admin' } })
  getSignedUrlMock.mockResolvedValue('https://signed.example/put')
  process.env.R2_ACCOUNT_ID = 'acct'
  process.env.R2_BUCKET = 'bucket'
  process.env.R2_PUBLIC_URL = 'https://media.tynnellhollinsphotography.com'
})

afterEach(() => {
  process.env = { ...env }
})

describe('POST /api/freebie-pdf/presign', () => {
  it('turns away anyone who is not an admin', async () => {
    requireAdminUserMock.mockResolvedValue(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))

    const res = await POST(makeRequest({ filename: 'guide.pdf', size: 1000 }))

    expect(res.status).toBe(403)
    expect(getSignedUrlMock).not.toHaveBeenCalled()
  })

  it('signs an upload for a PDF and returns the public link it will have', async () => {
    const res = await POST(makeRequest({ filename: 'Wedding Guide.pdf', size: 1000 }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.uploadUrl).toBe('https://signed.example/put')
    expect(body.url).toMatch(/^https:\/\/media\.tynnellhollinsphotography\.com\/files\/[0-9a-f-]{36}-wedding-guide\.pdf$/)
  })

  it('signs the exact type, size and storage key, so the upload cannot be swapped for something else', async () => {
    const res = await POST(makeRequest({ filename: 'guide.pdf', size: 1234 }))
    const { url } = await res.json()

    const command = getSignedUrlMock.mock.calls[0][1]
    expect(command.input).toMatchObject({ Bucket: 'bucket', ContentType: 'application/pdf', ContentLength: 1234 })
    expect(url).toBe(`https://media.tynnellhollinsphotography.com/${command.input.Key}`)
  })

  it('makes links that Site Settings later recognises as its own upload, so a replaced guide gets cleaned up', async () => {
    for (const filename of ['Wedding Guide.pdf', '!!!.pdf', '../../<script>Guide!!.pdf']) {
      getSignedUrlMock.mockClear()
      const { url } = await (await POST(makeRequest({ filename, size: 1000 }))).json()

      expect(uploadedFreebieKey(url)).toBe(getSignedUrlMock.mock.calls[0][1].input.Key)
    }
  })

  it('keeps an odd file name from escaping the files folder', async () => {
    const res = await POST(makeRequest({ filename: '../../<script>Guide!!.pdf', size: 1000 }))
    const { url } = await res.json()

    expect(url).toMatch(/\/files\/[0-9a-f-]{36}-script-guide\.pdf$/)
  })

  it('keeps only letters, numbers and dashes in the stored name', async () => {
    const res = await POST(makeRequest({ filename: 'Final.v2 Guide/2026.pdf', size: 1000 }))
    const { url } = await res.json()

    expect(url).toMatch(/\/files\/[0-9a-f-]{36}-2026\.pdf$/)

    const res2 = await POST(makeRequest({ filename: 'Final.v2 Guide.pdf', size: 1000 }))
    expect((await res2.json()).url).toMatch(/\/files\/[0-9a-f-]{36}-final-v2-guide\.pdf$/)
  })

  it('names the file "guide" when nothing usable is left of its name', async () => {
    const res = await POST(makeRequest({ filename: '!!!.pdf', size: 1000 }))
    const { url } = await res.json()

    expect(url).toMatch(/\/files\/[0-9a-f-]{36}-guide\.pdf$/)
  })

  it('refuses a file that is not a PDF', async () => {
    const res = await POST(makeRequest({ filename: 'guide.docx', size: 1000 }))

    expect(res.status).toBe(415)
    expect((await res.json()).error).toMatch(/PDF/)
    expect(getSignedUrlMock).not.toHaveBeenCalled()
  })

  it('refuses a PDF over the size limit', async () => {
    const res = await POST(makeRequest({ filename: 'guide.pdf', size: MAX_FREEBIE_PDF_BYTES + 1 }))

    expect(res.status).toBe(413)
    expect(getSignedUrlMock).not.toHaveBeenCalled()
  })

  it('accepts a PDF exactly at the size limit', async () => {
    const res = await POST(makeRequest({ filename: 'guide.pdf', size: MAX_FREEBIE_PDF_BYTES }))

    expect(res.status).toBe(200)
  })

  it.each([0, -5, 1.5, '1000', undefined])('refuses a missing or nonsense size (%s)', async (size) => {
    const res = await POST(makeRequest({ filename: 'guide.pdf', size }))

    expect(res.status).toBe(400)
    expect(getSignedUrlMock).not.toHaveBeenCalled()
  })

  it('refuses a request with no file name', async () => {
    const res = await POST(makeRequest({ size: 1000 }))

    expect(res.status).toBe(400)
  })

  it('refuses a body that is not JSON', async () => {
    const res = await POST(new Request('https://tynnellhollinsphotography.com/api/freebie-pdf/presign', { method: 'POST', body: 'nope' }))

    expect(res.status).toBe(400)
  })

  it('says storage is not set up instead of signing a broken link', async () => {
    delete process.env.R2_ACCOUNT_ID

    const res = await POST(makeRequest({ filename: 'guide.pdf', size: 1000 }))

    expect(res.status).toBe(503)
    expect(getSignedUrlMock).not.toHaveBeenCalled()
  })

  it('reports a signing failure as a server error', async () => {
    getSignedUrlMock.mockRejectedValue(new Error('boom'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(makeRequest({ filename: 'guide.pdf', size: 1000 }))

    expect(res.status).toBe(500)
  })
})
