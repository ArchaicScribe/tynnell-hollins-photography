import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SITE_DESIGN_FIELDS } from '@/test/siteDesignFields'

const findGlobalMock = vi.fn()

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ findGlobal: findGlobalMock }),
}))

vi.mock('@payload-config', () => ({ default: {} }))

// React's cache() memoizes per request on the server. Pass-through here so
// every test gets a fresh read instead of the first test's result.
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <T,>(fn: T) => fn,
}))

const { getSiteDesign, DEFAULT_THEME } = await import('./siteDesign')

// A stored SiteDesign doc where every field holds a value that differs from
// DEFAULT_THEME and from every other field, so a field that is unmapped,
// mapped from the wrong source, or swallowed by a `|| default` shows up.
function distinctDoc(): Record<string, unknown> {
  const doc: Record<string, unknown> = {}
  for (const field of SITE_DESIGN_FIELDS) {
    const fallback = (DEFAULT_THEME as unknown as Record<string, unknown>)[field.name]
    if (field.type === 'text') doc[field.name] = `stored-${field.name}`
    if (field.type === 'checkbox') doc[field.name] = fallback === true ? false : true
    if (field.type === 'select') doc[field.name] = field.options.find((o) => o !== fallback)
  }
  return doc
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getSiteDesign', () => {
  it('carries every stored SiteDesign field through to the theme', async () => {
    const doc = distinctDoc()
    findGlobalMock.mockResolvedValue(doc)

    const theme = (await getSiteDesign()) as unknown as Record<string, unknown>

    for (const field of SITE_DESIGN_FIELDS) {
      expect(theme[field.name], `SiteDesign.${field.name} is not mapped by getSiteDesign`).toBe(doc[field.name])
    }
  })

  it('falls back to the default for every field the global has never saved', async () => {
    // A freshly created global row: nothing set yet.
    findGlobalMock.mockResolvedValue({ id: 1 })

    const theme = await getSiteDesign()

    expect(theme).toEqual(DEFAULT_THEME)
  })

  it('keeps the public site rendering with defaults when the global read fails', async () => {
    findGlobalMock.mockRejectedValue(new Error('relation "site_design" does not exist'))

    const theme = await getSiteDesign()

    expect(theme).toEqual(DEFAULT_THEME)
  })
})
