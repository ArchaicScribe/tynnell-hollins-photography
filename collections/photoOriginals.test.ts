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

// Just enough of a Payload request for the hooks: the uploaded file and the
// per-request context Payload passes from one hook to the next.
function request(file?: Awaited<ReturnType<typeof bigUpload>>) {
  return { file, context: {} as Record<string, unknown> }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const run = (hook: any, args: Record<string, unknown>) => hook(args)

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
    const data = await run(hooks.beforeChange, { data: { title: 'Renamed' }, context: req.context, operation: 'update' })

    expect(factory).not.toHaveBeenCalled()
    expect(data).toEqual({ title: 'Renamed' })
  })

  it('deletes the private original when the photo is deleted', async () => {
    const { store, objects } = memoryStore()
    objects.set('abc/first-dance.jpg', Buffer.from('x'))
    const hooks = photoOriginalHooks(() => store)

    await run(hooks.afterDelete, { doc: { id: 1, originalKey: 'abc/first-dance.jpg' } })

    expect(objects.has('abc/first-dance.jpg')).toBe(false)
  })

  it("deletes the old private original when a photo's file is replaced", async () => {
    const { store, objects } = memoryStore()
    objects.set('old/a.jpg', Buffer.from('old'))
    objects.set('new/b.jpg', Buffer.from('new'))
    const hooks = photoOriginalHooks(() => store)

    await run(hooks.afterChange, { doc: { originalKey: 'new/b.jpg' }, previousDoc: { originalKey: 'old/a.jpg' }, operation: 'update' })

    expect([...objects.keys()]).toEqual(['new/b.jpg'])
  })

  it('keeps the private original when a photo is saved without a new file', async () => {
    const { store, objects } = memoryStore()
    objects.set('same/a.jpg', Buffer.from('x'))
    const hooks = photoOriginalHooks(() => store)

    await run(hooks.afterChange, { doc: { originalKey: 'same/a.jpg' }, previousDoc: { originalKey: 'same/a.jpg' }, operation: 'update' })

    expect(objects.has('same/a.jpg')).toBe(true)
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

    await expect(run(hooks.afterDelete, { doc: { id: 1, originalKey: 'abc/a.jpg' } })).resolves.not.toThrow()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
