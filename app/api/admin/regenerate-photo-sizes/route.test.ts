import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// TYN-11: re-saving a photo with a file attached sends that file through the
// private-original hooks as if it were a new upload. Rebuilding sizes from the
// public display copy would store that copy as the "original" and delete the
// real full-resolution file, so the rebuild must start from the private
// original whenever a photo has one.

const authMock = vi.fn()
const findByIDMock = vi.fn()
const updateMock = vi.fn()
const privateGetMock = vi.fn()

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ auth: authMock, findByID: findByIDMock, update: updateMock }),
}))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
// Order of the post-process steps, to pin: treatment, then sharpening, then watermark.
const steps: string[] = []
const treatmentMock = vi.fn()
const sharpeningMock = vi.fn()
vi.mock('@/app/lib/photoTreatment', () => ({ applyPhotoTreatmentIfEnabled: (...a: unknown[]) => treatmentMock(...a) }))
vi.mock('@/app/lib/sharpening', () => ({ applySharpeningIfEnabled: (...a: unknown[]) => sharpeningMock(...a) }))
const watermarkMock = vi.fn()
vi.mock('@/app/lib/watermark', () => ({ applyWatermarkIfEnabled: (...a: unknown[]) => watermarkMock(...a) }))
vi.mock('@aws-sdk/client-s3', () => ({ S3Client: class {} }))
vi.mock('@/app/lib/privateOriginals', () => ({
  r2OriginalsStore: () => ({ get: privateGetMock, put: vi.fn(), delete: vi.fn() }),
}))

const { POST } = await import('./route')

const regenerate = () =>
  POST(new Request('https://tynnellhollinsphotography.com/api/admin/regenerate-photo-sizes', { method: 'POST', body: JSON.stringify({ id: 5 }) }))

const PHOTO = { id: 5, filename: 'first-dance.jpg', mimeType: 'image/jpeg', url: 'https://media.example/first-dance.jpg' }

beforeEach(() => {
  authMock.mockReset().mockResolvedValue({ user: { id: 1 } })
  findByIDMock.mockReset()
  updateMock.mockReset().mockResolvedValue({ ...PHOTO, sizes: {} })
  privateGetMock.mockReset()
  steps.length = 0
  treatmentMock.mockReset().mockImplementation(async () => void steps.push('treatment'))
  sharpeningMock.mockReset().mockImplementation(async () => void steps.push('sharpening'))
  watermarkMock.mockReset().mockImplementation(async () => void steps.push('watermark'))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('public-display-copy')))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const savedFile = () => updateMock.mock.calls[0][0].file

describe('regenerate photo sizes', () => {
  it('rebuilds from the private full-resolution original, not the public display copy', async () => {
    findByIDMock.mockResolvedValue({ ...PHOTO, originalKey: 'abc/first-dance.jpg' })
    privateGetMock.mockResolvedValue({ body: new Response('full-res-master').body, contentType: 'image/jpeg' })

    const res = await regenerate()

    expect(res.status).toBe(200)
    expect(privateGetMock).toHaveBeenCalledWith('abc/first-dance.jpg')
    expect(fetch).not.toHaveBeenCalled()
    expect(savedFile().data.toString()).toBe('full-res-master')
    expect(savedFile().size).toBe('full-res-master'.length)
  })

  // A photo uploaded before private originals existed: its public file is
  // still the full-resolution original, so rebuilding moves it privately.
  it('rebuilds a photo that has not been moved yet from its public file', async () => {
    findByIDMock.mockResolvedValue(PHOTO)

    await regenerate()

    expect(privateGetMock).not.toHaveBeenCalled()
    expect(savedFile().data.toString()).toBe('public-display-copy')
  })

  it('stops without touching the photo when the private original cannot be read', async () => {
    findByIDMock.mockResolvedValue({ ...PHOTO, originalKey: 'abc/first-dance.jpg' })
    privateGetMock.mockRejectedValue(new Error('NoSuchKey'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await regenerate()

    expect(res.status).toBe(500)
    expect(updateMock).not.toHaveBeenCalled()
    error.mockRestore()
  })

  // Builder pages and blog posts store photo URLs as plain strings. Renaming
  // the files (first-dance.jpg to first-dance-1.jpg) would break every one.
  it('keeps the same public filenames', async () => {
    findByIDMock.mockResolvedValue(PHOTO)

    await regenerate()

    expect(updateMock.mock.calls[0][0].overwriteExistingFiles).toBe(true)
  })

  // The private original is already where it belongs; storing it again
  // would only re-upload it under a new key.
  it('keeps the existing private original rather than storing it again', async () => {
    findByIDMock.mockResolvedValue({ ...PHOTO, originalKey: 'abc/first-dance.jpg' })
    privateGetMock.mockResolvedValue({ body: new Response('full-res-master').body, contentType: 'image/jpeg' })

    await regenerate()

    expect(updateMock.mock.calls[0][0].context).toEqual({ reuseOriginalKey: 'abc/first-dance.jpg' })
  })

  it('stores a not-yet-moved photo as a new private original', async () => {
    findByIDMock.mockResolvedValue(PHOTO)

    await regenerate()

    expect(updateMock.mock.calls[0][0].context?.reuseOriginalKey).toBeUndefined()
  })

  // The Photos collection finishes every rebuild itself (collections/photoSizePipeline.ts).
  // The colour treatment mutes again each time it runs, so doing it here as well would
  // mute these photos twice.
  it('rebuilds the sizes once and leaves treating, sharpening and watermarking to the Photos collection', async () => {
    findByIDMock.mockResolvedValue(PHOTO)

    const res = await regenerate()

    expect(res.status).toBe(200)
    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(steps).toEqual([])
  })

  it('reports a failed rebuild', async () => {
    findByIDMock.mockResolvedValue(PHOTO)
    updateMock.mockRejectedValue(new Error('storage error'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await regenerate()

    expect(res.status).toBe(500)
    error.mockRestore()
  })
})
