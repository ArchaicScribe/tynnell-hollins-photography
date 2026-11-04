import { describe, it, expect, vi } from 'vitest'
import { excludePhotoIds, getPrivateOnlyPhotoIds, isGalleryPubliclyVisible, privateOnlyPhotoIds } from './galleryVisibility'

const PAST = '2020-01-01T00:00:00.000Z'
const FUTURE = '2999-01-01T00:00:00.000Z'

function gallery(overrides: Record<string, unknown> = {}) {
  return {
    status: 'published',
    isPasswordProtected: false,
    expiresAt: null,
    photos: [],
    ...overrides,
  } as Parameters<typeof isGalleryPubliclyVisible>[0]
}

const rows = (...ids: number[]) => ids.map(id => ({ photo: id }))

describe('isGalleryPubliclyVisible', () => {
  it('allows a published, unprotected, unexpired gallery', () => {
    expect(isGalleryPubliclyVisible(gallery())).toBe(true)
    expect(isGalleryPubliclyVisible(gallery({ expiresAt: FUTURE }))).toBe(true)
  })

  it('rejects drafts', () => {
    expect(isGalleryPubliclyVisible(gallery({ status: 'draft' }))).toBe(false)
  })

  it('rejects password-protected galleries', () => {
    expect(isGalleryPubliclyVisible(gallery({ isPasswordProtected: true }))).toBe(false)
  })

  it('rejects expired galleries', () => {
    expect(isGalleryPubliclyVisible(gallery({ expiresAt: PAST }))).toBe(false)
  })
})

describe('privateOnlyPhotoIds', () => {
  it('collects photos from draft, protected, and expired galleries', () => {
    const ids = privateOnlyPhotoIds([
      gallery({ status: 'draft', photos: rows(1) }),
      gallery({ isPasswordProtected: true, photos: rows(2) }),
      gallery({ expiresAt: PAST, photos: rows(3) }),
      gallery({ photos: rows(4) }),
    ])
    expect(ids.sort()).toEqual([1, 2, 3])
  })

  it('does not withhold a photo that is also in a public gallery', () => {
    const ids = privateOnlyPhotoIds([
      gallery({ isPasswordProtected: true, photos: rows(7, 8) }),
      gallery({ photos: rows(8) }),
    ])
    expect(ids).toEqual([7])
  })

  it('reads populated photo objects as well as raw ids', () => {
    const ids = privateOnlyPhotoIds([
      gallery({ status: 'draft', photos: [{ photo: { id: 9 } }, { photo: null }] }),
    ])
    expect(ids).toEqual([9])
  })
})

describe('getPrivateOnlyPhotoIds', () => {
  it('loads every gallery unpaginated and derives the ids', async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [gallery({ isPasswordProtected: true, photos: rows(11) })],
    })
    const ids = await getPrivateOnlyPhotoIds({ find } as never)
    expect(ids).toEqual([11])
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'galleries', pagination: false }))
  })
})

describe('excludePhotoIds', () => {
  it('returns the original where when there is nothing to exclude', () => {
    const where = { category: { equals: 'weddings' } }
    expect(excludePhotoIds(where, [])).toBe(where)
  })

  it('ANDs an id not_in clause onto the query', () => {
    expect(excludePhotoIds({ category: { equals: 'weddings' } }, [1, 2])).toEqual({
      and: [{ category: { equals: 'weddings' } }, { id: { not_in: [1, 2] } }],
    })
  })
})
