import { describe, it, expect, vi, beforeEach } from 'vitest'

// Regenerating a photo's sizes re-saves it through Payload with its original
// file. Without overwriteExistingFiles, Payload sees the photo's own row already
// using that filename and renames the file to "name-1.jpg", then deletes the old
// original and sizes. Several places store the size URLs as plain strings (the page
// builder's image fields, the blog editor, menu cards), so every one of them would
// 404. This is the trap behind the missing "-1" About selfies, and the reason
// "Apply to all photos" must never ship without the flag.

const calls: string[] = []
const updateMock = vi.fn()
const findByIDMock = vi.fn()

vi.mock('payload', () => ({
  getPayload: async () => ({
    auth: async () => ({ user: { id: 1, role: 'admin' } }),
    findByID: findByIDMock,
    update: updateMock,
  }),
}))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@aws-sdk/client-s3', () => ({ S3Client: class {} }))
vi.mock('@/app/lib/photoFinish', () => ({ finishPhotoSizes: async () => void calls.push('finish') }))

const { POST } = await import('./route')

const request = (body: unknown) =>
  new Request('https://tynnellhollinsphotography.com/api/admin/regenerate-photo-sizes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  calls.length = 0
  updateMock.mockReset().mockResolvedValue({ id: 7, sizes: {} })
  findByIDMock.mockReset().mockResolvedValue({
    id: 7,
    url: 'https://media.example.com/DSC07442-1.JPG',
    filename: 'DSC07442-1.JPG',
    mimeType: 'image/jpeg',
  })
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer })))
})

describe('POST /api/admin/regenerate-photo-sizes', () => {
  it('keeps the photo under its own filename instead of renaming it name-1', async () => {
    const res = await POST(request({ id: 7 }))

    expect(res.status).toBe(200)
    const args = updateMock.mock.calls[0][0]
    expect(args.overwriteExistingFiles).toBe(true)
    expect(args.file.name).toBe('DSC07442-1.JPG')
  })

  it('rebuilds the sizes once and leaves treating, sharpening and watermarking to the Photos collection', async () => {
    // The collection finishes every rebuild itself (collections/photoSizePipeline.ts).
    // The treatment mutes again each time it runs, so doing it here as well would
    // mute these photos twice.
    const res = await POST(request({ id: 7 }))

    expect(res.status).toBe(200)
    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(calls).toEqual([])
  })

  it('reports a failed rebuild', async () => {
    updateMock.mockRejectedValue(new Error('storage error'))

    const res = await POST(request({ id: 7 }))

    expect(res.status).toBe(500)
  })
})
