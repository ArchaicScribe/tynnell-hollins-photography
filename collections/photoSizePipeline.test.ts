import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CollectionAfterOperationHook, CollectionBeforeChangeHook } from 'payload'
import { Photos } from './Photos'

// Every time Payload rebuilds a photo's sizes (an upload, the regenerate route, or a
// crop / focal point edit in the admin) the rebuilt files come out at natural colour,
// unsharpened and unwatermarked. The collection finishes them itself, once, after
// Payload and the R2 upload are done. A plain edit (title, featured) rebuilds nothing
// and must not touch the files, because the colour treatment is not idempotent.

const postProcess = vi.fn()
vi.mock('@/app/lib/photoPostProcess', () => ({ postProcessPhotoSizes: (p: unknown) => postProcess(p) }))
vi.mock('@/app/lib/r2', () => ({ r2Client: () => ({ client: true }), r2Bucket: () => 'bucket' }))

const { flagRebuiltSizes, postProcessRebuiltSizes } = await import('./photoSizePipeline')

type Req = { payloadUploadSizes?: Record<string, unknown>; context?: Record<string, unknown> }

const rebuilt = { thumbnail: Buffer.from('t'), card: Buffer.from('c'), hero: Buffer.from('h') }

function flag(req: Req) {
  return (flagRebuiltSizes as CollectionBeforeChangeHook)({ data: {}, req } as never)
}

function finish(args: { operation: string; req: Req; result: unknown }) {
  return (postProcessRebuiltSizes as CollectionAfterOperationHook)(args as never)
}

const doc = { id: 7, filename: 'DSC1.jpg', mimeType: 'image/jpeg', sizes: { card: { filename: 'DSC1-1200x900.jpg' } } }

beforeEach(() => {
  postProcess.mockReset().mockResolvedValue(undefined)
})

describe('flagRebuiltSizes (before a photo is saved)', () => {
  it('remembers that Payload rebuilt the sizes during this request', async () => {
    const req: Req = { payloadUploadSizes: { ...rebuilt }, context: {} }

    await flag(req)

    expect(req.context!.photoSizesRebuilt).toBe(true)
  })

  it.each([
    ['nothing was rebuilt', {}],
    ['the sizes were never set', undefined],
  ])('does not flag when %s', async (_label, sizes) => {
    const req: Req = { payloadUploadSizes: sizes, context: {} }

    await flag(req)

    expect(req.context!.photoSizesRebuilt).toBeUndefined()
  })

  it('works when the request has no context object yet', async () => {
    const req: Req = { payloadUploadSizes: { ...rebuilt } }

    await flag(req)

    expect(req.context!.photoSizesRebuilt).toBe(true)
  })

  it('returns the data unchanged', async () => {
    const data = { title: 'x' }
    const out = await (flagRebuiltSizes as CollectionBeforeChangeHook)({ data, req: { context: {} } } as never)

    expect(out).toBe(data)
  })
})

describe('postProcessRebuiltSizes (after the whole save and upload)', () => {
  it.each(['create', 'updateByID'])('finishes the new sizes after a %s that rebuilt them', async (operation) => {
    const req: Req = { context: { photoSizesRebuilt: true } }

    const out = await finish({ operation, req, result: doc })

    expect(postProcess).toHaveBeenCalledTimes(1)
    expect(postProcess.mock.calls[0][0]).toMatchObject({
      bucket: 'bucket',
      sizes: doc.sizes,
      label: 'DSC1.jpg',
      main: { filename: 'DSC1.jpg', mimeType: 'image/jpeg' },
    })
    expect(out).toBe(doc)
  })

  it('does nothing for a plain edit that rebuilt no sizes', async () => {
    await finish({ operation: 'updateByID', req: { context: {} }, result: doc })

    expect(postProcess).not.toHaveBeenCalled()
  })

  it('runs once even if the operation ends twice in one request', async () => {
    const req: Req = { context: { photoSizesRebuilt: true } }

    await finish({ operation: 'updateByID', req, result: doc })
    await finish({ operation: 'updateByID', req, result: doc })

    expect(postProcess).toHaveBeenCalledTimes(1)
  })

  it("skips the storage plugin's own follow-up save, which is not a rebuild of its own", async () => {
    const req: Req = { context: { photoSizesRebuilt: true, skipCloudStorage: true } }

    await finish({ operation: 'updateByID', req, result: doc })

    expect(postProcess).not.toHaveBeenCalled()
    expect(req.context!.photoSizesRebuilt).toBe(true) // still waiting for the real end of the operation
  })

  it.each(['find', 'delete', 'update'])('ignores a %s operation', async (operation) => {
    await finish({ operation, req: { context: { photoSizesRebuilt: true } }, result: doc })

    expect(postProcess).not.toHaveBeenCalled()
  })

  it('never fails the save when finishing the files throws', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    postProcess.mockRejectedValue(new Error('R2 down'))

    const out = await finish({ operation: 'create', req: { context: { photoSizesRebuilt: true } }, result: doc })

    expect(out).toBe(doc)
  })
})

describe('Photos collection wiring', () => {
  it('flags before the change and finishes after the operation', () => {
    expect(Photos.hooks?.beforeChange).toContain(flagRebuiltSizes)
    expect(Photos.hooks?.afterOperation).toContain(postProcessRebuiltSizes)
  })
})
