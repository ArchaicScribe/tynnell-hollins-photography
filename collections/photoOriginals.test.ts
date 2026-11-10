import { describe, it, expect, vi } from 'vitest'
import sharp from 'sharp'
import type { OriginalsStore } from '@/app/lib/privateOriginals'
import { photoOriginalHooks } from './photoOriginals'

// TYN-11: the Photos collection keeps every upload's full-resolution file in
// a private bucket and publishes a display-size copy instead. These hooks are
// what every upload path (Photo Library, gallery drag-and-drop, builder image
// picker, Payload's own upload field) goes through.

function memoryStore() {
  const objects = new Map<string, Buffer>()
  const store: OriginalsStore = {
    async put(key, body) { objects.set(key, body) },
    async get() { throw new Error('not used') },
    async delete(key) { objects.delete(key) },
  }
  return { store, objects }
}

async function bigUpload() {
  const data = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: { r: 9, g: 9, b: 9 } } }).jpeg().toBuffer()
  return { data, mimetype: 'image/jpeg', name: 'first-dance.jpg', size: data.length }
}

// Just enough of a Payload request for the hooks: the uploaded file, the
// per-request context Payload passes from one hook to the next, and a count
// of the photos (as saved so far) that point at a private original.
function request(file?: Awaited<ReturnType<typeof bigUpload>>, photos: { originalKey?: string }[] = []) {
  const count = vi.fn(async ({ where }: { where: { originalKey: { equals: string } } }) => ({
    totalDocs: photos.filter((p) => p.originalKey === where.originalKey.equals).length,
  }))
  return { file, context: {} as Record<string, unknown>, payload: { count } }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const run = (hook: any, args: Record<string, unknown>) => hook(args)

// One save through the hooks in Payload's order: beforeOperation, then
// beforeChange (Payload writes the row here, the storage plugin uploads the
// public file in afterChange), then afterOperation.
async function replaceFile(hooks: ReturnType<typeof photoOriginalHooks>, req: ReturnType<typeof request>, previousKey: string) {
  await run(hooks.beforeOperation, { args: { req }, operation: 'update', req, context: req.context })
  await run(hooks.beforeChange, { data: {}, originalDoc: { originalKey: previousKey }, context: req.context, operation: 'update', req })
}
const finish = (hooks: ReturnType<typeof photoOriginalHooks>, req: ReturnType<typeof request>) =>
  run(hooks.afterOperation, { args: { req }, operation: 'updateByID', req, result: { id: 1 } })

describe('photo original hooks', () => {
  it('stores the uploaded file privately and hands Payload the display copy instead', async () => {
    const { store, objects } = memoryStore()
    const hooks = photoOriginalHooks(() => store)
    const upload = await bigUpload()
    const req = request(upload)

    await run(hooks.beforeOperation, { args: { req }, operation: 'create', req, context: req.context })

    const [key] = [...objects.keys()]
    expect(objects.get(key)?.equals(upload.data)).toBe(true)
    expect((await sharp(req.file!.data).metadata()).width).toBe(2560)
    expect(req.context.originalKey).toBe(key)
  })

  it('records where the private original lives on the photo', async () => {
    const hooks = photoOriginalHooks(() => memoryStore().store)

    const data = await run(hooks.beforeChange, { data: { title: 'First dance' }, context: { originalKey: 'abc/first-dance.jpg' }, operation: 'create' })

    expect(data).toEqual({ title: 'First dance', originalKey: 'abc/first-dance.jpg' })
  })

  it('leaves photo saves that carry no new file alone', async () => {
    const factory = vi.fn(() => memoryStore().store)
    const hooks = photoOriginalHooks(factory)
    const req = request()

    await run(hooks.beforeOperation, { args: { req }, operation: 'update', req, context: req.context })
    const data = await run(hooks.beforeChange, { data: { title: 'Renamed' }, originalDoc: { originalKey: 'same/a.jpg' }, context: req.context, operation: 'update', req })
    await finish(hooks, req)

    expect(factory).not.toHaveBeenCalled()
    expect(data).toEqual({ title: 'Renamed' })
  })

  it('deletes the private original when the photo is deleted', async () => {
    const { store, objects } = memoryStore()
    objects.set('abc/first-dance.jpg', Buffer.from('x'))
    const hooks = photoOriginalHooks(() => store)

    await run(hooks.afterDelete, { doc: { id: 1, originalKey: 'abc/first-dance.jpg' }, req: request() })

    expect(objects.has('abc/first-dance.jpg')).toBe(false)
  })

  // The public file is uploaded in the storage plugin's afterChange, which
  // runs after ours. If it fails, Payload rolls the photo back to the old
  // original, so that must still exist until the whole save has finished.
  it("deletes the old private original only once a photo's file replacement has finished", async () => {
    const { store, objects } = memoryStore()
    objects.set('old/a.jpg', Buffer.from('old'))
    const hooks = photoOriginalHooks(() => store)
    const req = request(await bigUpload())

    await replaceFile(hooks, req, 'old/a.jpg')
    expect(objects.has('old/a.jpg')).toBe(true)

    await finish(hooks, req)
    expect(objects.has('old/a.jpg')).toBe(false)
    expect(objects.size).toBe(1)
  })

  // The storage plugin re-saves the photo with the same request inside the
  // outer save, so the queued delete must run once, not again later.
  it('only runs a queued delete once', async () => {
    const del = vi.fn(async () => {})
    const store: OriginalsStore = { async put() {}, async get() { throw new Error('not used') }, delete: del }
    const hooks = photoOriginalHooks(() => store)
    const req = request(await bigUpload())

    await replaceFile(hooks, req, 'old/a.jpg')
    await finish(hooks, req)
    await finish(hooks, req)

    expect(del).toHaveBeenCalledTimes(1)
  })

  it('keeps the private original when a photo is saved without a new file', async () => {
    const { store, objects } = memoryStore()
    objects.set('same/a.jpg', Buffer.from('x'))
    const hooks = photoOriginalHooks(() => store)
    const req = request()

    await run(hooks.beforeChange, { data: {}, originalDoc: { originalKey: 'same/a.jpg' }, context: req.context, operation: 'update', req })
    await finish(hooks, req)

    expect(objects.has('same/a.jpg')).toBe(true)
  })

  // A duplicated photo, or one pointed at another's key, shares the file.
  it('keeps a private original another photo still uses when a photo is deleted', async () => {
    const { store, objects } = memoryStore()
    objects.set('shared/a.jpg', Buffer.from('x'))
    const hooks = photoOriginalHooks(() => store)

    await run(hooks.afterDelete, { doc: { id: 1, originalKey: 'shared/a.jpg' }, req: request(undefined, [{ originalKey: 'shared/a.jpg' }]) })

    expect(objects.has('shared/a.jpg')).toBe(true)
  })

  it("keeps a private original another photo still uses when a photo's file is replaced", async () => {
    const { store, objects } = memoryStore()
    objects.set('shared/a.jpg', Buffer.from('x'))
    const hooks = photoOriginalHooks(() => store)
    const req = request(await bigUpload(), [{ originalKey: 'shared/a.jpg' }])

    await replaceFile(hooks, req, 'shared/a.jpg')
    await finish(hooks, req)

    expect(objects.has('shared/a.jpg')).toBe(true)
  })

  // Regenerating sizes rebuilds from the private original itself. Storing it
  // again under a new key would re-upload up to 200 MB for nothing.
  it('reuses the existing private original when the server asks it to', async () => {
    const { store, objects } = memoryStore()
    objects.set('keep/a.jpg', Buffer.from('master'))
    const hooks = photoOriginalHooks(() => store)
    const req = request(await bigUpload())
    req.context.reuseOriginalKey = 'keep/a.jpg'

    await replaceFile(hooks, req, 'keep/a.jpg')
    const data = await run(hooks.beforeChange, { data: {}, originalDoc: { originalKey: 'keep/a.jpg' }, context: req.context, operation: 'update', req })
    await finish(hooks, req)

    expect([...objects.keys()]).toEqual(['keep/a.jpg'])
    expect((await sharp(req.file!.data).metadata()).width).toBe(2560)
    expect(data.originalKey).toBe('keep/a.jpg')
  })

  // The photo is already gone or saved; a cleanup failure must not undo that.
  it('does not fail a delete when the private copy cannot be removed', async () => {
    const store: OriginalsStore = {
      async put() {},
      async get() { throw new Error('not used') },
      async delete() { throw new Error('R2 unavailable') },
    }
    const hooks = photoOriginalHooks(() => store)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(run(hooks.afterDelete, { doc: { id: 1, originalKey: 'abc/a.jpg' }, req: request() })).resolves.not.toThrow()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
