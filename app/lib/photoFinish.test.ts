import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import sharp from 'sharp'

// A photo's web renditions are finished after Payload makes them: colour treatment
// (muted, faded, black and white), sharpening, then the watermark. They used to be
// three separate download, transform, JPEG-encode, upload passes, and the last two
// re-encoded at sharp's default quality 80 even for the card (85) and hero (88). This
// does all three in memory on one download and encodes once at the size's own quality.
//
// The colour treatment must match the CSS saturate() filter it replaced (it used to
// be a filter on every <img>, which made large photos janky to scroll).

const getSiteDesignMock = vi.fn()
vi.mock('./siteDesign', () => ({ getSiteDesign: () => getSiteDesignMock() }))

const { saturationMatrix, finishBuffer, watermarkOnly, loadFinishPlan, finishPhotoSizes } = await import('./photoFinish')

const NOTHING = { saturation: 1, sharpenSigma: null, watermark: null }

async function solid(r: number, g: number, b: number, w = 8, h = 8): Promise<Buffer> {
  return sharp({ create: { width: w, height: h, channels: 3, background: { r, g, b } } })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toBuffer()
}

async function pixel(buf: Buffer, x?: number, y?: number): Promise<[number, number, number]> {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const px = x ?? Math.floor(info.width / 2)
  const py = y ?? Math.floor(info.height / 2)
  const i = (py * info.width + px) * info.channels
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

describe('finishBuffer', () => {
  it('returns the input untouched when there is nothing to do, with no re-encode', async () => {
    const input = await solid(200, 60, 60)

    expect(await finishBuffer(input, NOTHING, 85)).toBe(input)
  })

  it.each([0.65, 0.3, 0])('colour treatment matches the CSS saturate(%s) look it replaces', async (s) => {
    const expected = cssSaturate(s, [200, 60, 60])

    const [r, g, b] = await pixel(await finishBuffer(await solid(200, 60, 60), { ...NOTHING, saturation: s }, 90))

    expect(Math.abs(r - expected[0])).toBeLessThanOrEqual(3)
    expect(Math.abs(g - expected[1])).toBeLessThanOrEqual(3)
    expect(Math.abs(b - expected[2])).toBeLessThanOrEqual(3)
  })

  it('makes black and white truly neutral', async () => {
    const [r, g, b] = await pixel(await finishBuffer(await solid(200, 60, 60), { ...NOTHING, saturation: 0 }, 90))

    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(2)
  })

  it('keeps the size and stays a JPEG', async () => {
    const out = await finishBuffer(await solid(10, 120, 200), { ...NOTHING, saturation: 0.65 }, 85)
    const meta = await sharp(out).metadata()

    expect(meta.format).toBe('jpeg')
    expect([meta.width, meta.height]).toEqual([8, 8])
  })

  it('sharpens an edge', async () => {
    const edge = await sharp({ create: { width: 40, height: 20, channels: 3, background: { r: 60, g: 60, b: 60 } } })
      .composite([{ input: { create: { width: 20, height: 20, channels: 3, background: { r: 200, g: 200, b: 200 } } }, left: 20, top: 0 }])
      .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
      .toBuffer()

    const before = await pixel(edge, 17, 10)
    const after = await pixel(await finishBuffer(edge, { ...NOTHING, sharpenSigma: 1.8 }, 95), 17, 10)

    expect(after[0]).toBeLessThan(before[0]) // the dark side gets darker next to the edge
  })

  // The watermark is laid on after sharpening, so its own hard edge is never sharpened
  // (that would draw a halo round it). A flat grey photo has nothing to sharpen, so the
  // grey right beside the watermark must stay grey.
  it('watermarks after sharpening, so there is no halo round the watermark', async () => {
    const base = await solid(128, 128, 128, 200, 100)
    const mark = await sharp({ create: { width: 20, height: 20, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).png().toBuffer()

    const out = await finishBuffer(base, { saturation: 1, sharpenSigma: 1.8, watermark: mark }, 95)

    // The watermark's left edge is at x=154. If it were sharpened, the grey touching it
    // would be pulled dark (about 77 at x=153 and 93 at x=152).
    const [touching] = await pixel(out, 153, 74)
    const [near] = await pixel(out, 152, 74)
    const [inside] = await pixel(out, 175, 74)
    expect(Math.abs(touching - 128)).toBeLessThanOrEqual(3)
    expect(Math.abs(near - 128)).toBeLessThanOrEqual(3)
    expect(inside).toBeGreaterThan(240) // and the watermark itself is there
  })

  it('puts the watermark in the bottom right corner at about a fifth of the width', async () => {
    const base = await solid(128, 128, 128, 400, 200)
    const mark = await sharp({ create: { width: 50, height: 50, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).png().toBuffer()

    const out = await finishBuffer(base, { ...NOTHING, watermark: mark }, 95)

    expect((await pixel(out, 60, 20))[0]).toBeLessThan(135) // top left untouched
    expect((await pixel(out, 350, 150))[0]).toBeGreaterThan(240) // bottom right marked (80px wide, 12px margin)
  })

  it('keeps a margin of about 3% of the width between the watermark and the edge', async () => {
    const base = await solid(128, 128, 128, 400, 200)
    const mark = await sharp({ create: { width: 50, height: 50, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).png().toBuffer()

    const out = await finishBuffer(base, { ...NOTHING, watermark: mark }, 95)

    expect((await pixel(out, 396, 150))[0]).toBeLessThan(135) // inside the 12px right margin: still photo
    expect((await pixel(out, 384, 150))[0]).toBeGreaterThan(240) // just inside the watermark
  })

  // A watermark that cannot be laid on (a file sharp cannot read, or one so tall it does
  // not fit) must cost the photo only its watermark, not its colour treatment and sharpening.
  describe('when the watermark cannot be applied', () => {
    beforeEach(() => void vi.spyOn(console, 'warn').mockImplementation(() => {}))

    it('still treats and sharpens when the watermark is not an image', async () => {
      const out = await finishBuffer(await solid(200, 60, 60, 100, 100), { saturation: 0, sharpenSigma: 1, watermark: Buffer.from('<html>502 Bad Gateway</html>') }, 90)

      const [r, g, b] = await pixel(out)
      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(2) // black and white was applied
    })

    it('still treats when the watermark is too tall to fit the photo', async () => {
      const tall = await sharp({ create: { width: 10, height: 80, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).png().toBuffer()

      const out = await finishBuffer(await solid(200, 60, 60, 400, 200), { ...NOTHING, saturation: 0, watermark: tall }, 90)

      const [r, g, b] = await pixel(out)
      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(2)
    })

    it('hands the photo back untouched when the watermark was the only step', async () => {
      const input = await solid(200, 60, 60)

      expect(await finishBuffer(input, { ...NOTHING, watermark: Buffer.from('not an image') }, 85)).toBe(input)
    })
  })

  // The point of doing it in one go: JPEG is lossy, so every extra encode costs detail.
  // Compare with the lossless reference (all three steps on raw pixels, no encode in
  // between) against the old way (encode after treatment, then again after sharpening and
  // again after the watermark, the last two at sharp's default quality).
  it('loses less than three separate encodes would', async () => {
    const noise = Buffer.alloc(160 * 120 * 3)
    for (let i = 0; i < noise.length; i++) noise[i] = 90 + ((i * 7919) % 90) // deterministic texture
    const base = await sharp(noise, { raw: { width: 160, height: 120, channels: 3 } }).jpeg({ quality: 95 }).toBuffer()
    const mark = await sharp({ create: { width: 30, height: 30, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.6 } } }).png().toBuffer()
    const plan = { saturation: 0.65, sharpenSigma: 1, watermark: mark }

    const rawOf = async (b: Buffer) => (await sharp(b).raw().toBuffer())
    const overlay = await sharp(mark).resize({ width: 32 }).extend({ bottom: 5, right: 5, background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
    const { data: t } = await sharp(base).toColourspace('srgb').recomb(saturationMatrix(0.65)).raw().toBuffer({ resolveWithObject: true })
    const { data: s } = await sharp(t, { raw: { width: 160, height: 120, channels: 3 } }).sharpen({ sigma: 1 }).raw().toBuffer({ resolveWithObject: true })
    const ideal = await sharp(s, { raw: { width: 160, height: 120, channels: 3 } })
      .composite([{ input: overlay, gravity: 'southeast' }])
      .removeAlpha()
      .raw()
      .toBuffer()

    const onePass = await rawOf(await finishBuffer(base, plan, 88))
    const step1 = await sharp(base).toColourspace('srgb').recomb(saturationMatrix(0.65)).jpeg({ quality: 88 }).toBuffer()
    const step2 = await sharp(step1).sharpen({ sigma: 1 }).toBuffer()
    const step3 = await sharp(step2).composite([{ input: overlay, gravity: 'southeast' }]).toBuffer()
    const threePass = await rawOf(step3)

    const mae = (a: Buffer) => a.reduce((sum, v, i) => sum + Math.abs(v - ideal[i]), 0) / a.length
    expect(mae(onePass)).toBeLessThan(mae(threePass))
  })
})

// TYN-11: a photo's own public file is a display-size copy (the full-resolution original
// is in a private bucket). It is watermarked too, or it would be the best free copy of the
// photo, but it is not recoloured or sharpened and keeps its own format.
describe('watermarkOnly', () => {
  const mark = () => sharp({ create: { width: 50, height: 50, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).png().toBuffer()

  it('puts the watermark on a JPEG without recolouring it, and keeps it a JPEG', async () => {
    const out = await watermarkOnly(await solid(200, 60, 60, 400, 200), await mark())

    expect((await sharp(out).metadata()).format).toBe('jpeg')
    const [r, g, b] = await pixel(out, 60, 20) // away from the corner
    expect(Math.abs(r - 200) + Math.abs(g - 60) + Math.abs(b - 60)).toBeLessThanOrEqual(9)
    expect((await pixel(out, 350, 150))[1]).toBeGreaterThan(200) // bottom right: the white watermark
  })

  it('keeps a PNG a PNG', async () => {
    const png = await sharp({ create: { width: 400, height: 200, channels: 3, background: { r: 10, g: 120, b: 200 } } }).png().toBuffer()

    const out = await watermarkOnly(png, await mark())

    expect((await sharp(out).metadata()).format).toBe('png')
  })
})

describe('loadFinishPlan', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reads the saturation, sharpening and watermark from the site design', async () => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'muted', sharpeningLevel: 'moderate', watermarkEnabled: true, watermarkUrl: 'https://m.example/w.png' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(Buffer.from('png-bytes'))))

    const plan = await loadFinishPlan()

    expect(plan.saturation).toBeCloseTo(0.65, 5)
    expect(plan.sharpenSigma).toBe(1)
    expect(plan.watermark?.toString()).toBe('png-bytes')
  })

  it.each([
    ['subtle', 0.5],
    ['moderate', 1],
    ['strong', 1.8],
  ])('sharpening %s is sigma %s', async (level, sigma) => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'color', sharpeningLevel: level, watermarkEnabled: false })

    expect((await loadFinishPlan()).sharpenSigma).toBe(sigma)
  })

  it('is a no-op when everything is off, and fetches nothing', async () => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'color', sharpeningLevel: 'none', watermarkEnabled: false, watermarkUrl: 'https://m.example/w.png' })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await loadFinishPlan()).toEqual(NOTHING)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('still finishes without a watermark when the watermark image cannot be fetched', async () => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'muted', sharpeningLevel: 'none', watermarkEnabled: true, watermarkUrl: 'https://m.example/w.png' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 404 })))
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const plan = await loadFinishPlan()

    expect(plan.watermark).toBeNull()
    expect(plan.saturation).toBeCloseTo(0.65, 5)
  })
})

describe('finishPhotoSizes', () => {
  const sent: { cmd: string; key: string; type?: string }[] = []
  const s3 = {
    send: vi.fn(async (command: { constructor: { name: string }; input: { Key: string; ContentType?: string } }) => {
      const name = command.constructor.name
      sent.push({ cmd: name, key: command.input.Key, type: command.input.ContentType })
      if (name === 'GetObjectCommand') return { Body: (async function* () { yield await solid(200, 60, 60) })() }
      return {}
    }),
  }
  const sizes = {
    thumbnail: { filename: 'a-400x300.jpg', mimeType: 'image/jpeg' },
    card: { filename: 'a-1200x900.jpg', mimeType: 'image/jpeg' },
    hero: { filename: 'a-2560x1440.jpg', mimeType: 'image/jpeg' },
  }
  const run = (s: Parameters<typeof finishPhotoSizes>[0]['sizes'] = sizes) => finishPhotoSizes({ s3: s3 as never, bucket: 'b', sizes: s })
  const count = (cmd: string) => sent.filter((s) => s.cmd === cmd).length

  beforeEach(() => {
    sent.length = 0
    s3.send.mockClear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(Buffer.from('png'))))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('does nothing when everything is off: no downloads, no uploads', async () => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'color', sharpeningLevel: 'none', watermarkEnabled: false })

    await run()

    expect(s3.send).not.toHaveBeenCalled()
  })

  it('downloads and uploads each size once, in place, even with all three steps on', async () => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'muted', sharpeningLevel: 'moderate', watermarkEnabled: true, watermarkUrl: 'https://m.example/w.png' })
    vi.mocked(fetch).mockResolvedValue(new Response(await sharp({ create: { width: 10, height: 10, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).png().toBuffer()))

    await run()

    expect(count('GetObjectCommand')).toBe(3)
    const puts = sent.filter((s) => s.cmd === 'PutObjectCommand')
    expect(puts.map((p) => p.key)).toEqual(['a-400x300.jpg', 'a-1200x900.jpg', 'a-2560x1440.jpg'])
    expect(puts.every((p) => p.type === 'image/jpeg')).toBe(true)
  })

  // Each size is encoded at the quality Payload generated it with (80 / 85 / 88), not at
  // one default. The same noisy picture comes out bigger at a higher quality.
  it('encodes the thumbnail, card and hero at their own qualities', async () => {
    const noise = Buffer.alloc(300 * 200 * 3)
    for (let i = 0; i < noise.length; i++) noise[i] = (i * 7919 + ((i * i) % 251)) % 256
    const noisy = await sharp(noise, { raw: { width: 300, height: 200, channels: 3 } }).jpeg({ quality: 100, chromaSubsampling: '4:4:4' }).toBuffer()
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'muted', sharpeningLevel: 'none', watermarkEnabled: false })
    const bodies: Record<string, number> = {}
    const send = vi.fn(async (command: { constructor: { name: string }; input: { Key: string; Body?: Buffer } }) => {
      if (command.constructor.name === 'GetObjectCommand') return { Body: (async function* () { yield noisy })() }
      bodies[command.input.Key] = (command.input.Body as Buffer).length
      return {}
    })

    await finishPhotoSizes({ s3: { send } as never, bucket: 'b', sizes })

    expect(bodies['a-400x300.jpg']).toBeLessThan(bodies['a-1200x900.jpg'])
    expect(bodies['a-1200x900.jpg']).toBeLessThan(bodies['a-2560x1440.jpg'])
  })

  it('does not upload a size it left untouched', async () => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'color', sharpeningLevel: 'none', watermarkEnabled: true, watermarkUrl: 'https://m.example/w.png' })
    vi.mocked(fetch).mockResolvedValue(new Response('<html>not an image</html>'))

    await run()

    expect(count('GetObjectCommand')).toBe(3)
    expect(count('PutObjectCommand')).toBe(0)
  })

  it('carries on with the other sizes when one fails', async () => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'bw', sharpeningLevel: 'none', watermarkEnabled: false })
    s3.send.mockImplementationOnce(async () => {
      throw new Error('R2 hiccup')
    })

    await run()

    expect(count('PutObjectCommand')).toBe(2)
  })

  it('skips a size the photo does not have', async () => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'muted', sharpeningLevel: 'none', watermarkEnabled: false })

    await run({ thumbnail: sizes.thumbnail, card: null, hero: undefined })

    expect(sent.filter((s) => s.cmd === 'PutObjectCommand').map((p) => p.key)).toEqual(['a-400x300.jpg'])
  })

  describe('the public display copy (main)', () => {
    const main = { filename: 'a.jpg', mimeType: 'image/jpeg' }
    const mark = async () => new Response(await sharp({ create: { width: 10, height: 10, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).png().toBuffer())

    it('is watermarked in place when there is a watermark, but not recoloured', async () => {
      getSiteDesignMock.mockResolvedValue({ photoTreatment: 'bw', sharpeningLevel: 'none', watermarkEnabled: true, watermarkUrl: 'https://m.example/w.png' })
      vi.mocked(fetch).mockImplementation(async () => mark())
      const bodies: Record<string, Buffer> = {}
      const send = vi.fn(async (command: { constructor: { name: string }; input: { Key: string; Body?: Buffer; ContentType?: string } }) => {
        if (command.constructor.name === 'GetObjectCommand') return { Body: (async function* () { yield await solid(200, 60, 60, 300, 200) })() }
        bodies[command.input.Key] = command.input.Body as Buffer
        return {}
      })

      await finishPhotoSizes({ s3: { send } as never, bucket: 'b', sizes, main })

      const [r, g, b] = await pixel(bodies['a.jpg'], 20, 20)
      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeGreaterThan(100) // still red: black and white is for the sizes only
      const [sr, sg, sb] = await pixel(bodies['a-400x300.jpg'], 20, 20)
      expect(Math.max(sr, sg, sb) - Math.min(sr, sg, sb)).toBeLessThanOrEqual(2) // the sizes are black and white
    })

    it('is left alone when there is no watermark, even if the sizes are recoloured', async () => {
      getSiteDesignMock.mockResolvedValue({ photoTreatment: 'muted', sharpeningLevel: 'none', watermarkEnabled: false })

      await run().then(() => finishPhotoSizes({ s3: s3 as never, bucket: 'b', sizes, main }))

      expect(sent.some((s) => s.key === 'a.jpg')).toBe(false)
    })

    it('can be the only thing a photo has, and a failing copy does not stop the sizes', async () => {
      getSiteDesignMock.mockResolvedValue({ photoTreatment: 'muted', sharpeningLevel: 'none', watermarkEnabled: true, watermarkUrl: 'https://m.example/w.png' })
      vi.mocked(fetch).mockImplementation(async () => mark())
      s3.send.mockImplementationOnce(async () => {
        throw new Error('R2 hiccup')
      }) // the display copy is the first download

      await finishPhotoSizes({ s3: s3 as never, bucket: 'b', sizes, main })

      expect(sent.filter((x) => x.cmd === 'PutObjectCommand').map((x) => x.key)).toEqual(['a-400x300.jpg', 'a-1200x900.jpg', 'a-2560x1440.jpg'])
      sent.length = 0
      await finishPhotoSizes({ s3: s3 as never, bucket: 'b', sizes: null, main })
      expect(sent.filter((x) => x.cmd === 'PutObjectCommand').map((x) => x.key)).toEqual(['a.jpg'])
    })
  })

  it('does nothing for a photo with no sizes', async () => {
    getSiteDesignMock.mockResolvedValue({ photoTreatment: 'muted', sharpeningLevel: 'none', watermarkEnabled: false })

    await run(null)

    expect(s3.send).not.toHaveBeenCalled()
  })
})
