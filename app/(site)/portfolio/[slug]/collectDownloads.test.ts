import { describe, it, expect, vi } from 'vitest'
import { collectDownloads } from './collectDownloads'

const photos = [
  { id: 1, filename: 'a.jpg', url: null },
  { id: 2, filename: 'a.jpg', url: null },
  { id: 3, filename: null, url: null },
]

const ok = () => new Response(new Uint8Array([1, 2, 3]))

describe('collectDownloads', () => {
  it('collects every photo with unique filenames', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => ok())
    const progress = vi.fn()

    const result = await collectDownloads(photos, 'smith-wedding', progress, fetchImpl)

    expect(Object.keys(result.files)).toEqual(['a.jpg', 'a-2.jpg', 'photo-3.jpg'])
    expect(result).toMatchObject({ failed: 0, unauthorized: false })
    expect(fetchImpl).toHaveBeenCalledWith('/api/photos/1/download?gallery=smith-wedding')
    expect(progress).toHaveBeenLastCalledWith(3)
  })

  it('counts failed photos instead of dropping them silently', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(new Response('nope', { status: 502 }))
      .mockRejectedValueOnce(new Error('network'))

    const result = await collectDownloads(photos, 'smith-wedding', undefined, fetchImpl)

    expect(Object.keys(result.files)).toEqual(['a.jpg'])
    expect(result).toMatchObject({ failed: 2, unauthorized: false })
  })

  it('stops at the first 401 and reports it', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('Unauthorized', { status: 401 }))

    const result = await collectDownloads(photos, 'smith-wedding', undefined, fetchImpl)

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ files: {}, failed: 3, unauthorized: true })
  })
})
