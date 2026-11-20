import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import sharp from 'sharp'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { keepPrivateOriginal, r2OriginalsStore, type OriginalsStore, type UploadedFile } from './privateOriginals'

// TYN-11: a client's download allowance only means something if the
// full-resolution file is reachable through the download route alone. Every
// upload keeps its untouched original in a private bucket and hands Payload a
// display-size copy to publish and resize.

function memoryStore() {
  const objects = new Map<string, { body: Buffer; contentType: string }>()
  const store: OriginalsStore = {
    async put(key, body, contentType) { objects.set(key, { body, contentType }) },
    async get() { throw new Error('not used') },
    async delete(key) { objects.delete(key) },
  }
  return { store, objects }
}

async function jpeg(width: number, height: number): Promise<UploadedFile> {
  const data = await sharp({ create: { width, height, channels: 3, background: { r: 120, g: 90, b: 60 } } }).jpeg({ quality: 95 }).toBuffer()
  return { data, mimetype: 'image/jpeg', name: 'first-dance.jpg', size: data.length }
}

const dims = async (file: UploadedFile) => {
  const { width, height } = await sharp(file.data).metadata()
  return [width, height]
}

describe('keepPrivateOriginal', () => {
  it('stores the full-resolution file privately, byte for byte', async () => {
    const { store, objects } = memoryStore()
    const upload = await jpeg(4000, 3000)

    const { originalKey } = await keepPrivateOriginal(upload, store)

    expect(objects.get(originalKey)?.body.equals(upload.data)).toBe(true)
    expect(objects.get(originalKey)?.contentType).toBe('image/jpeg')
  })

  it('hands back a landscape copy no wider than 2560px', async () => {
    const { store } = memoryStore()
    const { file } = await keepPrivateOriginal(await jpeg(4000, 3000), store)

    expect(await dims(file)).toEqual([2560, 1920])
  })

  it('hands back a portrait copy no taller than 2560px', async () => {
    const { store } = memoryStore()
    const { file } = await keepPrivateOriginal(await jpeg(3000, 5000), store)

    expect(await dims(file)).toEqual([1536, 2560])
  })

  // Phones save portrait photos as landscape pixels plus an orientation tag.
  // The display copy drops metadata, so it must be turned upright first.
  it('turns a phone photo upright before shrinking it', async () => {
    const { store } = memoryStore()
    const data = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: { r: 1, g: 2, b: 3 } } })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer()

    const { file } = await keepPrivateOriginal({ data, mimetype: 'image/jpeg', name: 'portrait.jpg', size: data.length }, store)

    expect(await dims(file)).toEqual([1920, 2560])
  })

  it('records the display copy as the file size Payload stores', async () => {
    const { store } = memoryStore()
    const { file } = await keepPrivateOriginal(await jpeg(4000, 3000), store)

    expect(file.size).toBe(file.data.length)
    expect(file.name).toBe('first-dance.jpg')
    expect(file.mimetype).toBe('image/jpeg')
  })

  // A small photo keeps its size, but its camera metadata (location
  // included) belongs only to the private original.
  it('publishes a photo that already fits within 2560px upright and without its metadata', async () => {
    const { store, objects } = memoryStore()
    const data = await sharp({ create: { width: 2000, height: 1500, channels: 3, background: { r: 1, g: 2, b: 3 } } })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer()
    expect((await sharp(data).metadata()).exif).toBeDefined()

    const { file, originalKey } = await keepPrivateOriginal({ data, mimetype: 'image/jpeg', name: 'small.jpg', size: data.length }, store)

    expect(await dims(file)).toEqual([1500, 2000])
    expect((await sharp(file.data).metadata()).exif).toBeUndefined()
    expect(objects.get(originalKey)?.body.equals(data)).toBe(true)
  })

  // Re-encoding would flatten an animated GIF to its first frame.
  it('publishes a GIF as uploaded', async () => {
    const { store } = memoryStore()
    const data = await sharp({ create: { width: 3000, height: 3000, channels: 3, background: { r: 1, g: 2, b: 3 } } }).gif().toBuffer()

    const { file } = await keepPrivateOriginal({ data, mimetype: 'image/gif', name: 'loop.gif', size: data.length }, store)

    expect(file.data.equals(data)).toBe(true)
  })

  // The name comes from the uploader's computer; the key should not carry
  // folders or characters that need escaping.
  it('files an original under a key with a cleaned-up filename', async () => {
    const { store } = memoryStore()
    const upload = { ...(await jpeg(100, 100)), name: 'wedding/first dance #1.jpg' }

    const { originalKey } = await keepPrivateOriginal(upload, store)

    expect(originalKey).toMatch(/^[0-9a-f-]{36}\/first-dance-1\.jpg$/)
  })

  it('files each original under its own unguessable key that keeps the filename', async () => {
    const { store } = memoryStore()
    const a = await keepPrivateOriginal(await jpeg(100, 100), store)
    const b = await keepPrivateOriginal(await jpeg(100, 100), store)

    expect(a.originalKey).not.toBe(b.originalKey)
    expect(a.originalKey).toMatch(/^[0-9a-f-]{36}\/first-dance\.jpg$/)
  })

  // Saving a photo without its master would lose the full-resolution file for good.
  it('fails the upload when the private copy cannot be stored', async () => {
    const store: OriginalsStore = {
      async put() { throw new Error('R2 unavailable') },
      async get() { throw new Error('not used') },
      async delete() {},
    }

    await expect(keepPrivateOriginal(await jpeg(4000, 3000), store)).rejects.toThrow(/full-resolution/i)
  })
})

describe('r2OriginalsStore', () => {
  const env = { ...process.env }

  beforeEach(() => {
    process.env.R2_ACCOUNT_ID = 'acct'
    process.env.R2_BUCKET = 'public-photos'
    process.env.R2_ORIGINALS_BUCKET = 'private-originals'
  })

  afterEach(() => {
    process.env = { ...env }
    vi.restoreAllMocks()
  })

  it('writes originals to the private bucket, never the public one', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({} as never)
    const body = Buffer.from('jpeg')

    await r2OriginalsStore().put('k/first-dance.jpg', body, 'image/jpeg')

    const command = send.mock.calls[0][0]
    expect(command).toBeInstanceOf(PutObjectCommand)
    expect(command.input).toEqual({ Bucket: 'private-originals', Key: 'k/first-dance.jpg', Body: body, ContentType: 'image/jpeg' })
  })

  it('reads and deletes originals in the private bucket', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({
      Body: { transformToWebStream: () => new ReadableStream() },
      ContentType: 'image/jpeg',
    } as never)
    const store = r2OriginalsStore()

    const got = await store.get('k/a.jpg')
    await store.delete('k/a.jpg')

    expect(got.contentType).toBe('image/jpeg')
    expect(send.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand)
    expect(send.mock.calls[0][0].input).toEqual({ Bucket: 'private-originals', Key: 'k/a.jpg' })
    expect(send.mock.calls[1][0]).toBeInstanceOf(DeleteObjectCommand)
    expect(send.mock.calls[1][0].input).toEqual({ Bucket: 'private-originals', Key: 'k/a.jpg' })
  })

  // Falling back to the public bucket would publish every original.
  it('refuses to work when no private bucket is configured', () => {
    delete process.env.R2_ORIGINALS_BUCKET

    expect(() => r2OriginalsStore()).toThrow(/R2_ORIGINALS_BUCKET/)
  })

  it('refuses a private bucket that is the public one', () => {
    process.env.R2_ORIGINALS_BUCKET = 'public-photos'

    expect(() => r2OriginalsStore()).toThrow(/public/i)
  })
})
