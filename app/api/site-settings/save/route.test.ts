import { describe, it, expect, vi, beforeEach } from 'vitest'

const updateGlobalMock = vi.fn()
const findGlobalMock = vi.fn()
const requireAdminUserMock = vi.fn()
const deleteR2ObjectMock = vi.fn()

vi.mock('@/app/lib/builderAuth', () => ({
  requireAdminUser: (...args: unknown[]) => requireAdminUserMock(...args),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// Only the storage call is faked: deciding which links are our own uploads
// stays the real code.
vi.mock('@/app/lib/r2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/lib/r2')>()),
  deleteR2Object: (...args: unknown[]) => deleteR2ObjectMock(...args),
}))

process.env.R2_PUBLIC_URL = 'https://media.tynnellhollinsphotography.com'

const { POST } = await import('./route')

function makeRequest(body: unknown): Request {
  return new Request('https://tynnellhollinsphotography.com/api/site-settings/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const card = { title: 'The wedding experience', linkLabel: 'Get the details', href: '/services', imageUrl: '' }

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminUserMock.mockResolvedValue({ payload: { updateGlobal: updateGlobalMock, findGlobal: findGlobalMock }, user: { id: 1, role: 'admin' } })
  updateGlobalMock.mockResolvedValue({})
  findGlobalMock.mockResolvedValue({ freebieUrl: '' })
  deleteR2ObjectMock.mockResolvedValue(undefined)
})

describe('POST /api/site-settings/save, menu cards', () => {
  it('saves the "Work with me" menu cards', async () => {
    const res = await POST(makeRequest({ menuCards: [card] }))

    expect(res.status).toBe(200)
    expect(updateGlobalMock).toHaveBeenCalledWith({ slug: 'site-config', data: { menuCards: [card] } })
  })

  it('cleans the cards before saving, so an unsafe link never reaches the database', async () => {
    await POST(makeRequest({ menuCards: [card, { ...card, title: 'Bad', href: 'javascript:alert(1)' }] }))

    expect(updateGlobalMock.mock.calls[0][0].data.menuCards).toEqual([card])
  })

  it('saves an empty list, which is how Tynnell removes the cards', async () => {
    await POST(makeRequest({ menuCards: [] }))

    expect(updateGlobalMock.mock.calls[0][0].data.menuCards).toEqual([])
  })

  it('still saves the plain text settings alongside the cards', async () => {
    await POST(makeRequest({ title: 'Tynnell Hollins Photography', menuCards: [card] }))

    expect(updateGlobalMock.mock.calls[0][0].data).toEqual({ title: 'Tynnell Hollins Photography', menuCards: [card] })
  })

  it('rejects a request from someone who is not an admin', async () => {
    const { NextResponse } = await import('next/server')
    requireAdminUserMock.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const res = await POST(makeRequest({ menuCards: [card] }))

    expect(res.status).toBe(401)
    expect(updateGlobalMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/site-settings/save, freebie', () => {
  it('saves the freebie title and link', async () => {
    await POST(makeRequest({ freebieTitle: 'The Wedding Planning Guide', freebieUrl: 'https://media.example/guide.pdf' }))

    expect(updateGlobalMock.mock.calls[0][0].data).toEqual({ freebieTitle: 'The Wedding Planning Guide', freebieUrl: 'https://media.example/guide.pdf' })
  })

  it('never stores a freebie link that is not a site page or https, and keeps the one already saved', async () => {
    // Overwriting with an empty link would quietly stop every freebie email.
    await POST(makeRequest({ freebieTitle: 'Guide', freebieUrl: 'javascript:alert(1)' }))

    expect(updateGlobalMock.mock.calls[0][0].data).not.toHaveProperty('freebieUrl')
  })

  it('clears the freebie link when Tynnell empties the box', async () => {
    await POST(makeRequest({ freebieUrl: '' }))

    expect(updateGlobalMock.mock.calls[0][0].data.freebieUrl).toBe('')
  })

  it('trims spaces around the freebie link', async () => {
    await POST(makeRequest({ freebieUrl: '  /guide.pdf ' }))

    expect(updateGlobalMock.mock.calls[0][0].data.freebieUrl).toBe('/guide.pdf')
  })
})

describe('POST /api/site-settings/save, cleaning up a replaced guide PDF', () => {
  const media = 'https://media.tynnellhollinsphotography.com'
  const oldKey = 'files/11111111-1111-4111-8111-111111111111-old-guide.pdf'
  const newKey = 'files/22222222-2222-4222-8222-222222222222-new-guide.pdf'
  const oldUrl = `${media}/${oldKey}`
  const newUrl = `${media}/${newKey}`

  // Braces matter: a function returned from beforeEach is run by Vitest as a
  // cleanup step, and mockResolvedValue returns the mock itself.
  beforeEach(() => {
    findGlobalMock.mockResolvedValue({ freebieUrl: oldUrl })
  })

  it('deletes the old uploaded guide once the new link is saved', async () => {
    const res = await POST(makeRequest({ freebieUrl: newUrl, freebieUrlBase: oldUrl }))

    expect(res.status).toBe(200)
    expect(deleteR2ObjectMock).toHaveBeenCalledWith(oldKey)
    expect(deleteR2ObjectMock).toHaveBeenCalledTimes(1)
    expect(updateGlobalMock.mock.invocationCallOrder[0]).toBeLessThan(deleteR2ObjectMock.mock.invocationCallOrder[0])
  })

  it('reads the saved link without expanding relations, as the database stores it', async () => {
    await POST(makeRequest({ freebieUrl: newUrl, freebieUrlBase: oldUrl }))

    expect(findGlobalMock).toHaveBeenCalledWith(expect.objectContaining({ slug: 'site-config', depth: 0 }))
  })

  it('deletes the old uploaded guide when the link is cleared', async () => {
    await POST(makeRequest({ freebieUrl: '', freebieUrlBase: oldUrl }))

    expect(deleteR2ObjectMock).toHaveBeenCalledWith(oldKey)
  })

  it('keeps the guide when the same link is saved again', async () => {
    await POST(makeRequest({ freebieTitle: 'Guide', freebieUrl: ` ${oldUrl} `, freebieUrlBase: oldUrl }))

    expect(deleteR2ObjectMock).not.toHaveBeenCalled()
  })

  it.each([
    ['a guide hosted somewhere else', 'https://drive.example.com/guide.pdf'],
    ['a page on the site', '/guide.pdf'],
    ['a photo in the same storage', `${media}/photos/wedding-01.jpg`],
  ])('never deletes %s that was saved before', async (_, previous) => {
    findGlobalMock.mockResolvedValue({ freebieUrl: previous })

    await POST(makeRequest({ freebieUrl: newUrl, freebieUrlBase: oldUrl }))

    expect(deleteR2ObjectMock).not.toHaveBeenCalled()
  })

  it('does nothing when no guide was saved before', async () => {
    findGlobalMock.mockResolvedValue({ freebieUrl: null })

    const res = await POST(makeRequest({ freebieUrl: newUrl, freebieUrlBase: oldUrl }))

    expect(res.status).toBe(200)
    expect(deleteR2ObjectMock).not.toHaveBeenCalled()
  })

  it('keeps the old guide when saving fails, so the saved link still works', async () => {
    updateGlobalMock.mockRejectedValue(new Error('db down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(makeRequest({ freebieUrl: newUrl, freebieUrlBase: oldUrl }))

    expect(res.status).toBe(500)
    expect(deleteR2ObjectMock).not.toHaveBeenCalled()
  })

  it('keeps the old guide when an unsafe new link is ignored', async () => {
    await POST(makeRequest({ freebieUrl: 'javascript:alert(1)', freebieUrlBase: oldUrl, freebieTitle: 'Guide' }))

    expect(deleteR2ObjectMock).not.toHaveBeenCalled()
  })

  it('does not look up the old guide when the link is not being changed', async () => {
    await POST(makeRequest({ freebieTitle: 'Guide' }))

    expect(findGlobalMock).not.toHaveBeenCalled()
    expect(deleteR2ObjectMock).not.toHaveBeenCalled()
  })

  it('still reports the save as done when the old file cannot be deleted', async () => {
    deleteR2ObjectMock.mockRejectedValue(new Error('denied'))
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(makeRequest({ freebieUrl: newUrl, freebieUrlBase: oldUrl }))

    expect(res.status).toBe(200)
    expect(logged).toHaveBeenCalled()
  })

  it('keeps the saved guide when the page started from a different link, because another tab replaced it since', async () => {
    // Tab loaded with an older guide; meanwhile oldUrl was uploaded and saved
    // elsewhere. Deleting oldUrl now would leave whatever this tab saves
    // pointing at nothing.
    const olderUrl = `${media}/files/33333333-3333-4333-8333-333333333333-older.pdf`

    await POST(makeRequest({ freebieUrl: newUrl, freebieUrlBase: olderUrl }))

    expect(deleteR2ObjectMock).not.toHaveBeenCalled()
  })

  it('deletes nothing when the page does not say which link it started from', async () => {
    await POST(makeRequest({ freebieUrl: newUrl }))

    expect(updateGlobalMock).toHaveBeenCalled()
    expect(findGlobalMock).not.toHaveBeenCalled()
    expect(deleteR2ObjectMock).not.toHaveBeenCalled()
  })

  it.each([
    ['a page jump', '#page=2'],
    ['a download flag', '?download=1'],
  ])('keeps the file when the new link is the same file with %s added', async (_, extra) => {
    await POST(makeRequest({ freebieUrl: `${oldUrl}${extra}`, freebieUrlBase: oldUrl }))

    expect(deleteR2ObjectMock).not.toHaveBeenCalled()
  })

  it('keeps the file while a menu card being saved still links to it', async () => {
    await POST(makeRequest({
      freebieUrl: newUrl,
      freebieUrlBase: oldUrl,
      menuCards: [{ title: 'Free guide', linkLabel: 'Get it', href: oldUrl, imageUrl: '' }],
    }))

    expect(deleteR2ObjectMock).not.toHaveBeenCalled()
  })

  it('keeps the file while an already saved menu card links to it', async () => {
    findGlobalMock.mockResolvedValue({
      freebieUrl: oldUrl,
      menuCards: [{ title: 'Free guide', linkLabel: 'Get it', href: oldUrl, imageUrl: '' }],
    })

    await POST(makeRequest({ freebieUrl: newUrl, freebieUrlBase: oldUrl }))

    expect(deleteR2ObjectMock).not.toHaveBeenCalled()
  })

  it('still deletes when the saved menu cards are being replaced by ones that no longer link to it', async () => {
    findGlobalMock.mockResolvedValue({
      freebieUrl: oldUrl,
      menuCards: [{ title: 'Free guide', linkLabel: 'Get it', href: oldUrl, imageUrl: '' }],
    })

    await POST(makeRequest({ freebieUrl: newUrl, freebieUrlBase: oldUrl, menuCards: [] }))

    expect(deleteR2ObjectMock).toHaveBeenCalledWith(oldKey)
  })

  it('never stores the starting link as a setting', async () => {
    await POST(makeRequest({ freebieUrl: newUrl, freebieUrlBase: oldUrl }))

    expect(updateGlobalMock.mock.calls[0][0].data).not.toHaveProperty('freebieUrlBase')
  })

  it('still saves when the old link cannot be read, and deletes nothing', async () => {
    findGlobalMock.mockRejectedValue(new Error('db hiccup'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(makeRequest({ freebieUrl: newUrl, freebieUrlBase: oldUrl }))

    expect(res.status).toBe(200)
    expect(updateGlobalMock).toHaveBeenCalled()
    expect(deleteR2ObjectMock).not.toHaveBeenCalled()
  })
})
