import { describe, it, expect, vi, beforeEach } from 'vitest'

// The three steps that finish a photo's web renditions after Payload has generated
// and stored them: colour treatment, then sharpening, then the watermark. The order
// matters (sharpening must not touch the watermark, and both should work on the final
// colours), and one failing step must never stop the others or fail the save.

const calls: string[] = []
const failing = new Set<string>()
const step = (name: string) => async () => {
  calls.push(name)
  if (failing.has(name)) throw new Error(`${name} boom`)
}

vi.mock('./photoTreatment', () => ({ applyPhotoTreatmentIfEnabled: step('treatment') }))
vi.mock('./sharpening', () => ({ applySharpeningIfEnabled: step('sharpening') }))
const watermarkArgs: unknown[] = []
vi.mock('./watermark', () => ({
  applyWatermarkIfEnabled: async (a: unknown) => {
    watermarkArgs.push(a)
    return step('watermark')()
  },
}))

const { postProcessPhotoSizes } = await import('./photoPostProcess')

const params = { s3: {} as never, bucket: 'b', sizes: {}, label: 'DSC1.jpg' }

beforeEach(() => {
  calls.length = 0
  watermarkArgs.length = 0
  failing.clear()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('postProcessPhotoSizes', () => {
  // TYN-11: the public display copy is a photo's best free image, so it gets the watermark too.
  it('also watermarks the public display copy when given one', async () => {
    await postProcessPhotoSizes({ ...params, main: { filename: 'DSC1.jpg', mimeType: 'image/jpeg' } })

    expect(watermarkArgs[0]).toMatchObject({ main: { filename: 'DSC1.jpg', mimeType: 'image/jpeg' } })
  })

  it('treats, then sharpens, then watermarks', async () => {
    await postProcessPhotoSizes(params)

    expect(calls).toEqual(['treatment', 'sharpening', 'watermark'])
  })

  it.each(['treatment', 'sharpening', 'watermark'])('still runs the other steps when %s fails', async (name) => {
    failing.add(name)

    await expect(postProcessPhotoSizes(params)).resolves.toBeUndefined()

    expect(calls).toEqual(['treatment', 'sharpening', 'watermark'])
  })
})
