import { describe, it, expect } from 'vitest'
import { Photos, photoOriginals } from './Photos'

// TYN-11: wiring check. The hooks themselves are tested in photoOriginals.test.ts.

/* eslint-disable @typescript-eslint/no-explicit-any */
const field = (name: string) => (Photos.fields as any[]).find((f) => f.name === name)

describe('Photos collection', () => {
  it('runs every upload through the private-original hooks', () => {
    expect(Photos.hooks?.beforeOperation).toContain(photoOriginals.beforeOperation)
    expect(Photos.hooks?.beforeChange).toContain(photoOriginals.beforeChange)
    expect(Photos.hooks?.afterChange).toContain(photoOriginals.afterChange)
    expect(Photos.hooks?.afterDelete).toContain(photoOriginals.afterDelete)
  })

  it('stores where the private original lives, hidden from the admin form', () => {
    expect(field('originalKey')).toMatchObject({ type: 'text', admin: { hidden: true } })
  })

  // The public REST API serves photo records to anyone; the key is internal.
  it('does not show the private original key to visitors', () => {
    const read = field('originalKey').access.read

    expect(read({ req: { user: null } })).toBe(false)
    expect(read({ req: { user: { id: 1 } } })).toBe(true)
  })
})
