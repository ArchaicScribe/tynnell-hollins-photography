import { describe, it, expect, vi, beforeEach } from 'vitest'

const findMock = vi.fn()

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ find: findMock }),
}))

vi.mock('@payload-config', () => ({ default: {} }))

const { default: sitemap } = await import('./sitemap')

const PAST = '2020-01-01T00:00:00.000Z'
const UPDATED = '2026-10-01T00:00:00.000Z'

function gallery(slug: string, overrides: Record<string, unknown> = {}) {
  return {
    slug,
    status: 'published',
    isPasswordProtected: false,
    expiresAt: null,
    seoIndexable: true,
    updatedAt: UPDATED,
    ...overrides,
  }
}

beforeEach(() => {
  findMock.mockReset()
})

describe('sitemap', () => {
  it('omits protected, expired, and non-indexable galleries', async () => {
    findMock.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === 'galleries') {
        return {
          docs: [
            gallery('public-wedding'),
            gallery('legacy-no-flag', { seoIndexable: undefined }),
            gallery('private-client', { isPasswordProtected: true }),
            gallery('old-client', { expiresAt: PAST }),
            gallery('hidden-from-search', { seoIndexable: false }),
          ],
        }
      }
      return { docs: [] }
    })

    const urls = (await sitemap()).map(entry => entry.url)
    const galleryUrls = urls.filter(u => u.includes('/portfolio/'))

    expect(galleryUrls).toEqual([
      'https://tynnellhollinsphotography.com/portfolio/public-wedding',
      'https://tynnellhollinsphotography.com/portfolio/legacy-no-flag',
    ])
  })
})
