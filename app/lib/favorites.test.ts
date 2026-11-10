import { describe, it, expect, beforeEach } from 'vitest'
import {
  changesSinceSent,
  favCookieName,
  normalizeEmail,
  readFavCookie,
  setFavorite,
  signFavCookie,
  visibleFavorites,
} from './favorites'

beforeEach(() => {
  process.env.PAYLOAD_SECRET = 'test-secret'
})

describe('favorites cookie', () => {
  it('is named after the gallery so each gallery keeps its own list', () => {
    expect(favCookieName('smith-wedding')).toBe('fav_smith-wedding')
  })

  it('reads back the list id it was signed for', () => {
    const value = signFavCookie('smith-wedding', 17)
    expect(readFavCookie('smith-wedding', value)).toBe(17)
  })

  it('rejects a cookie whose list id was changed by hand', () => {
    const value = signFavCookie('smith-wedding', 17)
    const forged = value.replace(/^17\./, '18.')
    expect(readFavCookie('smith-wedding', forged)).toBeNull()
  })

  it('rejects a cookie signed for a different gallery', () => {
    const value = signFavCookie('smith-wedding', 17)
    expect(readFavCookie('jones-family', value)).toBeNull()
  })

  it('rejects a missing or malformed cookie', () => {
    expect(readFavCookie('smith-wedding', undefined)).toBeNull()
    expect(readFavCookie('smith-wedding', '')).toBeNull()
    expect(readFavCookie('smith-wedding', 'not-a-cookie')).toBeNull()
    expect(readFavCookie('smith-wedding', 'abc.def')).toBeNull()
  })

  it('rejects every cookie when the signing secret is not configured', () => {
    const value = signFavCookie('smith-wedding', 17)
    delete process.env.PAYLOAD_SECRET
    expect(readFavCookie('smith-wedding', value)).toBeNull()
  })
})

describe('normalizeEmail', () => {
  it('trims and lower-cases so the same person always finds the same list', () => {
    expect(normalizeEmail('  Jane.Doe@Example.COM ')).toBe('jane.doe@example.com')
  })
})

describe('setFavorite', () => {
  const gallery = { galleryPhotoIds: [1, 2, 3, 4], limit: null }

  it('adds a photo to the list', () => {
    expect(setFavorite([1], 3, true, gallery)).toEqual({ ok: true, photoIds: [1, 3] })
  })

  it('removes a photo from the list', () => {
    expect(setFavorite([1, 3], 1, false, gallery)).toEqual({ ok: true, photoIds: [3] })
  })

  it('leaves the list unchanged when the photo is already a favorite', () => {
    expect(setFavorite([1, 3], 3, true, gallery)).toEqual({ ok: true, photoIds: [1, 3] })
  })

  it('refuses a photo that is not in the gallery', () => {
    expect(setFavorite([1], 99, true, gallery)).toEqual({ ok: false, reason: 'not_in_gallery' })
  })

  it('refuses a new favorite once the limit is reached', () => {
    expect(setFavorite([1, 2], 3, true, { ...gallery, limit: 2 })).toEqual({ ok: false, reason: 'limit_reached' })
  })

  it('still allows removing a favorite at the limit', () => {
    expect(setFavorite([1, 2], 2, false, { ...gallery, limit: 2 })).toEqual({ ok: true, photoIds: [1] })
  })

  it('treats a limit of 0 as no limit', () => {
    expect(setFavorite([1, 2], 3, true, { ...gallery, limit: 0 })).toEqual({ ok: true, photoIds: [1, 2, 3] })
  })

  it('does not count favorites whose photo has since left the gallery toward the limit', () => {
    expect(setFavorite([1, 99], 2, true, { ...gallery, limit: 2 })).toEqual({ ok: true, photoIds: [1, 2] })
  })
})

describe('visibleFavorites', () => {
  it('keeps only photos still in the gallery, in gallery order', () => {
    expect(visibleFavorites([4, 99, 1], [1, 2, 3, 4])).toEqual([1, 4])
  })

  it('treats a list with no saved photos as empty', () => {
    expect(visibleFavorites(null, [1, 2])).toEqual([])
    expect(visibleFavorites('junk', [1, 2])).toEqual([])
  })
})

describe('changesSinceSent', () => {
  it('reports what was added and removed since the last send', () => {
    expect(changesSinceSent([1, 2, 5], [1, 3])).toEqual({ added: [2, 5], removed: [3] })
  })

  it('reports no changes when the list matches what was sent', () => {
    expect(changesSinceSent([2, 1], [1, 2])).toEqual({ added: [], removed: [] })
  })
})
