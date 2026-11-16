import { describe, it, expect, vi, beforeEach } from 'vitest'

const findMock = vi.fn()
const builderLinksMock = vi.fn()

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ find: (...args: unknown[]) => findMock(...args) }),
}))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/app/lib/nav', () => ({ getBuilderNavLinks: () => builderLinksMock() }))

const { getFooterData, STRIP_MAX, TERMS_SLUG, PRIVACY_SLUG } = await import('./footerData')

type Args = { collection: string; where?: { and?: { slug?: { equals: string } }[] }; limit?: number; sort?: string }

// photos: what the featured-photos query returns; pages: slugs of published pages.
function givenDatabase({ photos = [], pages = [] }: { photos?: object[]; pages?: string[] }) {
  findMock.mockImplementation(async (args: Args) => {
    if (args.collection === 'photos') return { docs: photos }
    const slug = args.where?.and?.find((c) => c.slug)?.slug?.equals
    return { docs: slug && pages.includes(slug) ? [{ slug }] : [] }
  })
}

const photo = (id: number, extra: object = {}) => ({ id, url: `https://media.example/${id}.jpg`, ...extra })

beforeEach(() => {
  vi.clearAllMocks()
  builderLinksMock.mockResolvedValue([])
})

describe('getFooterData, photo strip', () => {
  it('uses the card size when there is one and the original otherwise', async () => {
    givenDatabase({ photos: [photo(1, { sizes: { card: { url: 'https://media.example/1-card.jpg' } } }), photo(2)] })

    const { stripPhotos } = await getFooterData()

    expect(stripPhotos).toEqual([
      { id: 1, src: 'https://media.example/1-card.jpg' },
      { id: 2, src: 'https://media.example/2.jpg' },
    ])
  })

  it('shows at most six photos, newest first', async () => {
    givenDatabase({ photos: Array.from({ length: 9 }, (_, i) => photo(i + 1)) })

    const { stripPhotos } = await getFooterData()

    expect(STRIP_MAX).toBe(6)
    const query = findMock.mock.calls.map(([a]) => a as Args).find((a) => a.collection === 'photos')!
    expect(query.sort).toBe('-updatedAt')
    expect(query.limit).toBe(6)
    expect(stripPhotos.length).toBeLessThanOrEqual(6)
  })

  it('skips a photo that has no url', async () => {
    givenDatabase({ photos: [photo(1), { id: 2, url: null }, photo(3)] })

    expect((await getFooterData()).stripPhotos.map((p) => p.id)).toEqual([1, 3])
  })
})

describe('getFooterData, terms and privacy', () => {
  it('is true only for a published page with that slug', async () => {
    givenDatabase({ pages: [TERMS_SLUG] })

    const data = await getFooterData()

    expect(data.hasTerms).toBe(true)
    expect(data.hasPrivacy).toBe(false)
  })

  it('asks only for published pages', async () => {
    givenDatabase({ pages: [TERMS_SLUG, PRIVACY_SLUG] })

    await getFooterData()

    const pageQueries = findMock.mock.calls.map(([a]) => a as Args).filter((a) => a.collection === 'pages')
    expect(pageQueries.length).toBe(2)
    for (const q of pageQueries) expect(JSON.stringify(q.where)).toContain('"published":{"equals":true}')
  })

  it('keeps the two slugs the footer links to', () => {
    expect(TERMS_SLUG).toBe('terms-and-conditions')
    expect(PRIVACY_SLUG).toBe('privacy-statement')
  })
})

describe('getFooterData, builder links', () => {
  it('passes builder pages through', async () => {
    givenDatabase({})
    builderLinksMock.mockResolvedValue([{ label: 'Pricing', href: '/pricing' }])

    expect((await getFooterData()).builderLinks).toEqual([{ label: 'Pricing', href: '/pricing' }])
  })

  it('drops a builder page that duplicates the terms or privacy link', async () => {
    givenDatabase({})
    builderLinksMock.mockResolvedValue([
      { label: 'Terms', href: `/${TERMS_SLUG}` },
      { label: 'Privacy', href: `/${PRIVACY_SLUG}` },
      { label: 'Pricing', href: '/pricing' },
    ])

    expect((await getFooterData()).builderLinks).toEqual([{ label: 'Pricing', href: '/pricing' }])
  })

  it('drops a builder page that duplicates a page the footer already lists', async () => {
    givenDatabase({})
    builderLinksMock.mockResolvedValue([
      { label: 'Services again', href: '/services' },
      { label: 'Weddings again', href: '/portfolio/weddings' },
      { label: 'Pricing', href: '/pricing' },
    ])

    expect((await getFooterData()).builderLinks).toEqual([{ label: 'Pricing', href: '/pricing' }])
  })
})

describe('getFooterData, a failed read', () => {
  it('returns an empty footer data set rather than throwing, builder links included', async () => {
    findMock.mockRejectedValue(new Error('database down'))
    builderLinksMock.mockResolvedValue([{ label: 'Pricing', href: '/pricing' }])

    await expect(getFooterData()).resolves.toEqual({
      stripPhotos: [],
      builderLinks: [],
      hasTerms: false,
      hasPrivacy: false,
    })
  })
})
