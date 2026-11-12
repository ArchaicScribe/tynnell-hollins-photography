import { describe, it, expect } from 'vitest'
import { photoItemFromDoc } from './photoItem'

// TYN-13 follow-up: the editor gets photos from the page load, the library
// fetch and a fresh upload. All three must carry the name as uploaded.
const doc = {
  id: 7,
  url: 'https://media.example/RAW-6-of-19-1.jpg',
  sizes: { card: { url: 'https://media.example/card.jpg' }, thumbnail: { url: 'https://media.example/thumb.jpg' } },
  alt: 'A photo',
  filename: 'RAW - 6 of 19-1.jpg',
  originalFilename: 'RAW - 6 of 19.jpg',
  category: 'weddings',
}

describe('photoItemFromDoc', () => {
  it('keeps both the stored and the original file name', () => {
    const item = photoItemFromDoc(doc)

    expect(item.filename).toBe('RAW - 6 of 19-1.jpg')
    expect(item.originalFilename).toBe('RAW - 6 of 19.jpg')
  })

  it('maps the usual fields', () => {
    expect(photoItemFromDoc(doc)).toMatchObject({
      id: 7,
      url: 'https://media.example/card.jpg',
      thumbUrl: 'https://media.example/thumb.jpg',
      alt: 'A photo',
      category: 'weddings',
    })
  })

  it('copes with a photo uploaded before the original name was kept', () => {
    const item = photoItemFromDoc({ id: 1, filename: 'smith.jpg' })

    expect(item.originalFilename).toBeNull()
    expect(item.filename).toBe('smith.jpg')
    expect(item.url).toBeNull()
  })
})
