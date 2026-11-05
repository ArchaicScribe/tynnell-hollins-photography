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
