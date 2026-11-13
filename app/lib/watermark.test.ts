import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import sharp from 'sharp'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

const designMock = vi.fn()
vi.mock('./siteDesign', () => ({ getSiteDesign: () => designMock() }))

const { applyWatermarkIfEnabled } = await import('./watermark')

// TYN-11: the public file is now a 2560px display copy rather than the
// untouched original, so it must carry the watermark like the smaller sizes.
// Left clean, it would be the best free copy of every photo on the site.

let photoBytes: Buffer
let markBytes: Buffer
let written: string[]

beforeEach(async () => {
  photoBytes = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 50, g: 50, b: 50 } } }).jpeg().toBuffer()
  markBytes = await sharp({ create: { width: 100, height: 40, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.8 } } }).png().toBuffer()
  written = []
  designMock.mockResolvedValue({ watermarkEnabled: true, watermarkUrl: 'https://media.example/mark.png' })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array(markBytes))))
  vi.spyOn(S3Client.prototype, 'send').mockImplementation(async (command: unknown) => {
    if (command instanceof GetObjectCommand) return { Body: (async function* () { yield photoBytes })() }
    if (command instanceof PutObjectCommand) written.push(command.input.Key!)
    return {}
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const s3 = () => new S3Client({ region: 'auto' })
const sizes = { thumbnail: { filename: 'a-400x300.jpg' }, card: { filename: 'a-1200x900.jpg' }, hero: { filename: 'a-2560x1440.jpg' } }

describe('applyWatermarkIfEnabled', () => {
  it('watermarks the public display copy as well as every smaller size', async () => {
    await applyWatermarkIfEnabled({ s3: s3(), bucket: 'photos', sizes, main: { filename: 'a.jpg', mimeType: 'image/jpeg' } })

    expect(written.sort()).toEqual(['a-1200x900.jpg', 'a-2560x1440.jpg', 'a-400x300.jpg', 'a.jpg'])
  })

  it('watermarks only the smaller sizes when no display copy is given', async () => {
    await applyWatermarkIfEnabled({ s3: s3(), bucket: 'photos', sizes })

    expect(written.sort()).toEqual(['a-1200x900.jpg', 'a-2560x1440.jpg', 'a-400x300.jpg'])
  })

  it('leaves every file alone when the watermark is switched off', async () => {
    designMock.mockResolvedValue({ watermarkEnabled: false, watermarkUrl: 'https://media.example/mark.png' })

    await applyWatermarkIfEnabled({ s3: s3(), bucket: 'photos', sizes, main: { filename: 'a.jpg', mimeType: 'image/jpeg' } })

    expect(written).toEqual([])
  })
})
