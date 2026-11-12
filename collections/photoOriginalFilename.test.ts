import { describe, it, expect } from 'vitest'
import type { CollectionBeforeValidateHook, Field } from 'payload'
import { Photos } from './Photos'
import { recordOriginalFilename } from './photoOriginalFilename'
import { fileNameForSearch } from '@/app/lib/photoFileName'

// TYN-13 follow-up: Payload renames a second upload of the same name to
// "name-1.jpg". The Favorites tab copies file names for a Lightroom search,
// so it needs the name Tynnell exported, which is kept in originalFilename.

type HookArgs = Parameters<CollectionBeforeValidateHook>[0]

function run(args: { operation: 'create' | 'update'; data: Record<string, unknown>; file?: { name: string } }) {
  return recordOriginalFilename({
    data: args.data,
    operation: args.operation,
    req: { file: args.file },
  } as unknown as HookArgs) as Record<string, unknown>
}

describe('recordOriginalFilename', () => {
  it('keeps the name of the uploaded file, not the de-duplicated stored name', () => {
    const data = run({
      operation: 'create',
      data: { filename: 'RAW - 6 of 19-1.jpg' },
      file: { name: 'RAW - 6 of 19.jpg' },
    })

    expect(data.originalFilename).toBe('RAW - 6 of 19.jpg')
    expect(data.filename).toBe('RAW - 6 of 19-1.jpg')
  })

  it('leaves a name that really ends in -1 alone', () => {
    const data = run({ operation: 'create', data: { filename: 'IMG-1.jpg' }, file: { name: 'IMG-1.jpg' } })

    expect(data.originalFilename).toBe('IMG-1.jpg')
  })

  it('does not rewrite it when the photo is edited later', () => {
    const data = run({
      operation: 'update',
      data: { filename: 'RAW - 6 of 19-1.jpg' },
      file: { name: 'RAW - 6 of 19-1.jpg' },
    })

    expect(data).not.toHaveProperty('originalFilename')
  })

  it('does nothing when no file came with the request', () => {
    const data = run({ operation: 'create', data: { title: 'A photo' } })

    expect(data).not.toHaveProperty('originalFilename')
  })
})

describe('Photos collection', () => {
  it('has an originalFilename field that is not shown in the admin form', () => {
    const f = (Photos.fields as Field[]).find(x => 'name' in x && x.name === 'originalFilename') as
      | (Field & { type: string; admin?: { hidden?: boolean } })
      | undefined

    expect(f?.type).toBe('text')
    expect(f?.admin?.hidden).toBe(true)
  })

  it('records the original filename on upload', async () => {
    let data: Record<string, unknown> = { filename: 'smith-1.jpg' }
    for (const hook of Photos.hooks?.beforeValidate ?? []) {
      data =
        ((await hook({
          data,
          operation: 'create',
          req: { file: { name: 'smith.jpg' } },
        } as unknown as HookArgs)) as Record<string, unknown>) ?? data
    }

    expect(data.originalFilename).toBe('smith.jpg')
  })
})

describe('fileNameForSearch', () => {
  it('prefers the original filename', () => {
    expect(fileNameForSearch({ originalFilename: 'RAW - 6 of 19.jpg', filename: 'RAW - 6 of 19-1.jpg' })).toBe(
      'RAW - 6 of 19.jpg',
    )
  })

  it('falls back to the stored name for photos uploaded before it was kept', () => {
    expect(fileNameForSearch({ originalFilename: null, filename: 'smith-1.jpg' })).toBe('smith-1.jpg')
    expect(fileNameForSearch({ filename: 'smith.jpg' })).toBe('smith.jpg')
  })

  it('returns null when the photo has no name at all', () => {
    expect(fileNameForSearch({})).toBeNull()
  })
})
