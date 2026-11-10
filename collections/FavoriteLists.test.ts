import { describe, it, expect, vi } from 'vitest'
import type { Field, PayloadRequest } from 'payload'
import { FavoriteLists } from './FavoriteLists'
import { Galleries } from './Galleries'

const anonymous = { req: { user: null } as unknown as PayloadRequest }
const signedIn = { req: { user: { id: 1 } } as unknown as PayloadRequest }

function field(fields: Field[], name: string) {
  return fields.find(f => 'name' in f && f.name === name) as (Field & Record<string, unknown>) | undefined
}

describe('FavoriteLists collection', () => {
  it('is stored as favorite-lists', () => {
    expect(FavoriteLists.slug).toBe('favorite-lists')
  })

  it('is hidden from the Payload admin, since lists are read in the gallery editor', () => {
    expect(FavoriteLists.admin?.hidden).toBe(true)
  })

  // Lists hold client names and emails. Clients reach their own list only
  // through /api/favorites, never through Payload's REST API.
  it.each(['read', 'create', 'update', 'delete'] as const)('refuses anonymous %s through Payload', op => {
    const rule = FavoriteLists.access?.[op] as (args: typeof anonymous) => boolean
    expect(rule(anonymous)).toBe(false)
    expect(rule(signedIn)).toBe(true)
  })

  it('belongs to one gallery', () => {
    const gallery = field(FavoriteLists.fields, 'gallery')
    expect(gallery).toMatchObject({ type: 'relationship', relationTo: 'galleries', required: true })
  })

  it('records who the list belongs to', () => {
    expect(field(FavoriteLists.fields, 'clientEmail')).toMatchObject({ type: 'email', required: true })
    expect(field(FavoriteLists.fields, 'clientName')).toMatchObject({ type: 'text' })
  })

  it('stores the favorites, and what was last sent to Tynnell', () => {
    expect(field(FavoriteLists.fields, 'photoIds')).toMatchObject({ type: 'json' })
    expect(field(FavoriteLists.fields, 'sentPhotoIds')).toMatchObject({ type: 'json' })
    expect(field(FavoriteLists.fields, 'sentAt')).toMatchObject({ type: 'date' })
  })
})

describe('Galleries favorites settings', () => {
  it('has a per-gallery switch that is off unless turned on', () => {
    const enabled = field(Galleries.fields, 'favoritesEnabled')
    expect(enabled).toMatchObject({ type: 'checkbox', defaultValue: false })
  })

  it('has an optional limit on how many photos a client can favorite', () => {
    const limit = field(Galleries.fields, 'favoritesLimit')
    expect(limit).toMatchObject({ type: 'number', min: 0 })
    expect(limit?.required).toBeFalsy()
  })
})

describe('one list per client per gallery', () => {
  // Declared on the collection, not only in migrate-db.mjs: `next dev` syncs
  // the database to the collection config and would drop an index it does
  // not know about.
  it('is a unique index Payload itself knows about', () => {
    expect(FavoriteLists.indexes).toEqual([{ fields: ['gallery', 'clientEmail'], unique: true }])
  })
})

describe('deleting a gallery', () => {
  // The list's gallery is required, and the database will not null it out,
  // so a gallery with lists could not be deleted unless they go first.
  it("deletes that gallery's favorites lists first", async () => {
    const hooks = Galleries.hooks?.beforeDelete ?? []
    expect(hooks).toHaveLength(1)
    const deleteMock = vi.fn().mockResolvedValue({ docs: [] })
    const req = { payload: { delete: deleteMock } } as unknown as PayloadRequest

    await hooks[0]({ id: 5, req } as unknown as Parameters<(typeof hooks)[0]>[0])

    expect(deleteMock).toHaveBeenCalledWith({
      collection: 'favorite-lists',
      where: { gallery: { equals: 5 } },
      req,
    })
  })
})
