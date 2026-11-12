import { describe, it, expect } from 'vitest'
import { buildCreateCollectionBody } from './newCollection'

// TYN-311: the body the Create New Collection page sends to POST /api/galleries.
describe('buildCreateCollectionBody', () => {
  it('sends the trimmed name and the category', () => {
    expect(buildCreateCollectionBody({ title: '  Smith Wedding ', category: 'weddings', eventDate: '' })).toMatchObject({
      title: 'Smith Wedding',
      category: 'weddings',
    })
  })

  it('sends the event date as the plain YYYY-MM-DD the date input gives', () => {
    expect(buildCreateCollectionBody({ title: 'Smith Wedding', category: 'weddings', eventDate: '2026-06-14' })).toMatchObject({
      eventDate: '2026-06-14',
    })
  })

  it('leaves the event date out when none was chosen', () => {
    const body = buildCreateCollectionBody({ title: 'Smith Wedding', category: 'weddings', eventDate: '' })

    expect(body).not.toHaveProperty('eventDate')
  })

  // Status, taped style, featured and downloads come from Gallery Presets
  // (TYN-323), applied by the Galleries create hook only for values the
  // request does not send. Sending a status here would override the presets.
  it('never sends a status, so Gallery Presets decide it', () => {
    const body = buildCreateCollectionBody({ title: 'Smith Wedding', category: 'weddings', eventDate: '2026-06-14' })

    expect(Object.keys(body).sort()).toEqual(['category', 'eventDate', 'title'])
  })
})
