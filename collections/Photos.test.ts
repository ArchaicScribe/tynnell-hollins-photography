import { describe, it, expect } from 'vitest'
import { Photos, photoOriginals } from './Photos'

// TYN-11: wiring check. The hooks themselves are tested in photoOriginals.test.ts.

/* eslint-disable @typescript-eslint/no-explicit-any */
const field = (name: string) => (Photos.fields as any[]).find((f) => f.name === name)

describe('Photos collection', () => {
  it('runs every upload through the private-original hooks', () => {
    expect(Photos.hooks?.beforeOperation).toContain(photoOriginals.beforeOperation)
    expect(Photos.hooks?.beforeChange).toContain(photoOriginals.beforeChange)
    expect(Photos.hooks?.afterOperation).toContain(photoOriginals.afterOperation)
    expect(Photos.hooks?.afterDelete).toContain(photoOriginals.afterDelete)
  })

  // Payload's Duplicate copies every field, so the copy would point at the
  // same private original as the photo it came from.
  it('cannot be duplicated', () => {
    expect(Photos.disableDuplicate).toBe(true)
  })

  // The formats the upload route accepts. Anything else (TIFF, say) would
  // be published at full resolution, since only these get a display copy.
  it('accepts only the image formats that get a display copy', () => {
    const upload = Photos.upload as { mimeTypes?: string[] }
    expect(upload.mimeTypes?.sort()).toEqual(['image/gif', 'image/jpeg', 'image/png', 'image/webp'])
  })

  it('stores where the private original lives, hidden from the admin form', () => {
    expect(field('originalKey')).toMatchObject({ type: 'text', admin: { hidden: true } })
  })

  // Photo records reach the browser for signed-in admins and, through any
  // future public read, for visitors; the key is internal either way.
  it('does not show the private original key to visitors', () => {
    const read = field('originalKey').access.read

    expect(read({ req: { user: null } })).toBe(false)
    expect(read({ req: { user: { id: 1 } } })).toBe(true)
  })
})
