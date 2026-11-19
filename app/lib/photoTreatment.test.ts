import { describe, it, expect, vi, beforeEach } from 'vitest'
import sharp from 'sharp'

// Option 2 of the scroll-jank work: the photo colour treatment (muted, faded, black
// and white) is baked into the web renditions when a photo is processed, instead of
// being a CSS filter the browser re-applies to every large photo on every frame. The
// baked look must match what the CSS filter produced, so this uses the exact CSS
// saturate() matrix.

const getSiteDesignMock = vi.fn()
vi.mock('./siteDesign', () => ({ getSiteDesign: () => getSiteDesignMock() }))

const { saturationMatrix, treatBuffer, applyPhotoTreatmentIfEnabled } = await import('./photoTreatment')

async function solid(r: number, g: number, b: number): Promise<Buffer> {
  return sharp({ create: { width: 8, height: 8, channels: 3, background: { r, g, b } } })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toBuffer()
}

async function centrePixel(buf: Buffer): Promise<[number, number, number]> {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const i = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * info.channels
  return [data[i], data[i + 1], data[i + 2]]
}

// CSS filter saturate(s) on one pixel, from the filter-effects spec
const cssSaturate = (s: number, [r, g, b]: [number, number, number]) => [
  (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b,
  (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b,
  (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b,
]

describe('saturationMatrix', () => {
  it('is the identity at 1, so natural colour changes nothing', () => {
    expect(saturationMatrix(1).flat().map((n) => +n.toFixed(3))).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1])
  })

  it('has rows that each sum to 1, so grey stays grey at any strength', () => {
    for (const s of [0, 0.3, 0.65, 1]) {
      for (const row of saturationMatrix(s)) expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
    }
  })
})

describe('treatBuffer', () => {
  it('returns the input untouched at saturation 1, with no re-encode', async () => {
    const input = await solid(200, 60, 60)

    expect(await treatBuffer(input, 1, 85)).toBe(input)
  })

  it.each([0.65, 0.3, 0])('matches the CSS saturate(%s) look it replaces', async (s) => {
    const input = await solid(200, 60, 60)
    const expected = cssSaturate(s, [200, 60, 60])

    const [r, g, b] = await centrePixel(await treatBuffer(input, s, 90))

    expect(Math.abs(r - expected[0])).toBeLessThanOrEqual(3)
    expect(Math.abs(g - expected[1])).toBeLessThanOrEqual(3)
    expect(Math.abs(b - expected[2])).toBeLessThanOrEqual(3)
  })

  it('makes black and white truly neutral', async () => {
    const [r, g, b] = await centrePixel(await treatBuffer(await solid(200, 60, 60), 0, 90))

    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(2)
  })

  it('keeps the size and stays a JPEG', async () => {
    const out = await treatBuffer(await solid(10, 120, 200), 0.65, 85)
    const meta = await sharp(out).metadata()

    expect(meta.format).toBe('jpeg')
    expect([meta.width, meta.height]).toEqual([8, 8])
  })
})

describe('applyPhotoTreatmentIfEnabled', () => {
  const sent: { cmd: string; key: string; body?: Buffer }[] = []
  const s3 = {
    send: vi.fn(async (command: { constructor: { name: string }; input: { Key: string; Body?: Buffer } }) => {
      const name = command.constructor.name
      sent.push({ cmd: name, key: command.input.Key, body: command.input.Body })
      if (name === 'GetObjectCommand') return { Body: (async function* () { yield await solid(200, 60, 60) })() }
      return {}
    }),
  }
  const sizes = {
    thumbnail: { filename: 'a-400x300.jpg', mimeType: 'image/jpeg' },
    card: { filename: 'a-1200x900.jpg', mimeType: 'image/jpeg' },
    hero: { filename: 'a-2560x1440.jpg', mimeType: 'image/jpeg' },
  }
  const run = () =>
    applyPhotoTreatmentIfEnabled({ s3: s3 as never, bucket: 'b', sizes })

  beforeEach(() => {
    sent.length = 0
    s3.send.mockClear()
  })

  it('does nothing at natural colour: no downloads, no uploads', async () => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'color' })

    await run()

    expect(s3.send).not.toHaveBeenCalled()
  })

  it('treats the thumbnail, card and hero in place, at the same keys', async () => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'muted' })

    await run()

    const puts = sent.filter((s) => s.cmd === 'PutObjectCommand')
    expect(puts.map((p) => p.key)).toEqual(['a-400x300.jpg', 'a-1200x900.jpg', 'a-2560x1440.jpg'])
    const [r, g] = await centrePixel(puts[0].body as Buffer)
    expect(r).toBeLessThan(200) // red pulled in
    expect(g).toBeGreaterThan(60) // and green lifted: muted, not darkened
  })

  it('carries on with the other sizes when one fails', async () => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'bw' })
    s3.send.mockImplementationOnce(async () => {
      throw new Error('R2 hiccup')
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await run()

    expect(sent.filter((s) => s.cmd === 'PutObjectCommand').length).toBe(2)
  })

  it('skips a size the photo does not have', async () => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'muted' })

    await applyPhotoTreatmentIfEnabled({ s3: s3 as never, bucket: 'b', sizes: { thumbnail: sizes.thumbnail, card: null, hero: undefined } })

    expect(sent.filter((s) => s.cmd === 'PutObjectCommand').map((p) => p.key)).toEqual(['a-400x300.jpg'])
  })
})
