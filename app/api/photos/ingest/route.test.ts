import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// TYN-11: a new upload's public file is a display-size copy (the
// full-resolution original goes to the private bucket in the Photos hooks),
// so ingest watermarks it along with the smaller sizes.

const authMock = vi.fn()
const createMock = vi.fn()
const watermarkMock = vi.fn()

vi.mock('payload', () => ({ getPayload: vi.fn().mockResolvedValue({ auth: authMock, create: createMock }) }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('@/app/lib/sharpening', () => ({ applySharpeningIfEnabled: vi.fn() }))
vi.mock('@/app/lib/watermark', () => ({ applyWatermarkIfEnabled: (...a: unknown[]) => watermarkMock(...a) }))

const { POST } = await import('./route')

beforeEach(() => {
  authMock.mockReset().mockResolvedValue({ user: { id: 1 } })
  createMock.mockReset().mockResolvedValue({ id: 9, filename: 'first-dance.jpg', mimeType: 'image/jpeg', sizes: { card: { filename: 'first-dance-1200x900.jpg' } } })
  watermarkMock.mockReset()
  vi.spyOn(S3Client.prototype, 'send').mockImplementation(async (command: unknown) => {
    if (command instanceof GetObjectCommand) return { Body: (async function* () { yield Buffer.from('jpeg') })() }
    return {}
  })
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('photo ingest', () => {
  it('watermarks the public display copy along with the smaller sizes', async () => {
    const res = await POST(new Request('https://tynnellhollinsphotography.com/api/photos/ingest', {
      method: 'POST',
      body: JSON.stringify({ key: 'temp/abc.jpg', filename: 'first-dance.jpg' }),
    }))

    expect(res.status).toBe(200)
    expect(watermarkMock.mock.calls[0][0]).toMatchObject({
      sizes: { card: { filename: 'first-dance-1200x900.jpg' } },
      main: { filename: 'first-dance.jpg', mimeType: 'image/jpeg' },
    })
  })

  // The temporary upload is the full-resolution file sitting in the public
  // bucket. A failed save (say, the private bucket is unreachable) must not
  // leave it there.
  it('removes the temporary full-resolution upload when the save fails', async () => {
    createMock.mockRejectedValue(new Error('Could not store the full-resolution original'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const send = vi.mocked(S3Client.prototype.send)

    const res = await POST(new Request('https://tynnellhollinsphotography.com/api/photos/ingest', {
      method: 'POST',
      body: JSON.stringify({ key: 'temp/abc.jpg', filename: 'first-dance.jpg' }),
    }))

    expect(res.status).toBe(500)
    const deleted = send.mock.calls.map(([c]) => c).find((c) => c instanceof DeleteObjectCommand)
    expect(deleted?.input).toMatchObject({ Key: 'temp/abc.jpg' })
  })
})
