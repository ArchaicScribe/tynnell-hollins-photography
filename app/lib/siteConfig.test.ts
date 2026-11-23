import { describe, it, expect, vi, beforeEach } from 'vitest'

const findGlobalMock = vi.fn()

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ findGlobal: findGlobalMock }),
}))

vi.mock('@payload-config', () => ({ default: {} }))

const { getSiteConfig } = await import('./siteConfig')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getSiteConfig footer text', () => {
  it('passes the saved footer bio and location to the site', async () => {
    findGlobalMock.mockResolvedValue({ footerBio: 'Photographing real moments.', footerLocation: 'Albuquerque, New Mexico' })

    const site = await getSiteConfig()

    expect(site.footerBio).toBe('Photographing real moments.')
    expect(site.footerLocation).toBe('Albuquerque, New Mexico')
  })

  it('has no bio and the original location line before either is saved', async () => {
    findGlobalMock.mockResolvedValue({ title: 'Tynnell Hollins Photography' })

    const site = await getSiteConfig()

    expect(site.footerBio).toBe('')
    expect(site.footerLocation).toBe('Based in New Mexico | Travel Worldwide')
  })

  it('falls back to the same defaults when the read fails', async () => {
    findGlobalMock.mockRejectedValue(new Error('database down'))

    const site = await getSiteConfig()

    expect(site.footerBio).toBe('')
    expect(site.footerLocation).toBe('Based in New Mexico | Travel Worldwide')
  })
})

describe('getSiteConfig menu cards', () => {
  it('passes the saved "Work with me" cards to the site, cleaned', async () => {
    // Payload adds an `id` to every array row; the site does not need it.
    findGlobalMock.mockResolvedValue({
      title: 'Tynnell Hollins Photography',
      menuCards: [
        { id: 'abc', title: 'The wedding experience', linkLabel: 'Get the details', href: '/services', imageUrl: null },
        { id: 'def', title: 'Unsafe', linkLabel: '', href: 'javascript:alert(1)', imageUrl: null },
      ],
    })

    const site = await getSiteConfig()

    expect(site.menuCards).toEqual([
      { title: 'The wedding experience', linkLabel: 'Get the details', href: '/services', imageUrl: '' },
    ])
  })

  it('has no cards before any are saved', async () => {
    findGlobalMock.mockResolvedValue({ title: 'Tynnell Hollins Photography' })

    expect((await getSiteConfig()).menuCards).toEqual([])
  })
})

// Tynnell has to be able to remove a social link or the location line. A saved empty
// string means "none" and must win over the built-in default; only a value that was
// never saved (null or missing) falls back to it.
describe('getSiteConfig cleared fields', () => {
  const FIELDS = ['instagramUrl', 'tiktokUrl', 'pinterestUrl', 'facebookUrl', 'footerLocation', 'footerBio'] as const

  it('keeps a social link, the location and the bio blank when they were cleared', async () => {
    findGlobalMock.mockResolvedValue({ instagramUrl: '', tiktokUrl: '', pinterestUrl: '', facebookUrl: '', footerLocation: '', footerBio: '' })

    const site = await getSiteConfig()

    for (const field of FIELDS) expect(site[field], field).toBe('')
  })

  it('still uses the defaults for values that were never saved', async () => {
    findGlobalMock.mockResolvedValue({ instagramUrl: null, tiktokUrl: undefined, footerLocation: null })

    const site = await getSiteConfig()

    expect(site.instagramUrl).toBe('https://instagram.com/tynnellhollinsphotography')
    expect(site.tiktokUrl).toBe('https://tiktok.com/@tynnellhollinsphotography')
    expect(site.footerLocation).toBe('Based in New Mexico | Travel Worldwide')
  })
})
