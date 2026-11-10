import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, type NextResponse } from 'next/server'

process.env.PAYLOAD_SECRET = 'test-secret'
process.env.CONTACT_TO_EMAIL = 'tynnell@example.com'

// ---------------------------------------------------------------------------
// A tiny in-memory stand-in for the two collections these routes touch.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown> & { id: number }
let galleries: Row[] = []
let lists: Row[] = []
let nextListId = 1

type Where = Record<string, { equals: unknown }> | { and: Where[] }
function matches(row: Row, where: Where | undefined): boolean {
  if (!where) return true
  if ('and' in where) return (where.and as Where[]).every(w => matches(row, w))
  return Object.entries(where).every(([key, cond]) => row[key] === (cond as { equals: unknown }).equals)
}

// Row locks, as the database would hold them: `execute` waits its turn for a
// given lock statement, and the lock is let go when that transaction ends.
const lockQueues = new Map<string, Promise<void>>()
const heldLocks = new Map<string, () => void>()
const lockStatements: string[] = []
let nextTransaction = 1
let failListLimit = false

const fakeDb = {
  sessions: {} as Record<string, { db: { transaction: string } }>,
  beginTransaction: vi.fn(async () => {
    const id = `tx-${nextTransaction++}`
    fakeDb.sessions[id] = { db: { transaction: id } }
    return id
  }),
  execute: vi.fn(async ({ db, raw }: { db: { transaction: string }; raw: string }) => {
    lockStatements.push(raw)
    const before = lockQueues.get(raw) ?? Promise.resolve()
    let release!: () => void
    const mine = new Promise<void>(resolve => { release = resolve })
    lockQueues.set(raw, before.then(() => mine))
    await before
    heldLocks.set(db.transaction, release)
  }),
  commitTransaction: vi.fn(async (id: string) => {
    heldLocks.get(id)?.()
    heldLocks.delete(id)
    delete fakeDb.sessions[id]
  }),
  rollbackTransaction: vi.fn(async (id: string) => {
    heldLocks.get(id)?.()
    heldLocks.delete(id)
    delete fakeDb.sessions[id]
  }),
}

const fakePayload = {
  db: fakeDb,
  find: vi.fn(async ({ collection, where }: { collection: string; where?: Where }) => {
    const rows = collection === 'galleries' ? galleries : lists
    return { docs: rows.filter(r => matches(r, where)) }
  }),
  findByID: vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
    const rows = collection === 'galleries' ? galleries : lists
    const row = rows.find(r => r.id === id)
    if (!row) throw new Error('Not Found')
    // A read is a snapshot, and takes a moment, as it does against a real
    // database: that gap is where two requests can overlap.
    const snapshot = { ...row }
    await new Promise(resolve => setTimeout(resolve, 2))
    return snapshot
  }),
  create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
    const row = { id: nextListId++, ...data }
    lists.push(row)
    return row
  }),
  update: vi.fn(async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
    const row = lists.find(r => r.id === id)
    if (!row) throw new Error('Not Found')
    Object.assign(row, data)
    return row
  }),
}

// The simulated browser's cookies. Responses write to it, requests read it.
let jar: Record<string, string> = {}

const sendMock = vi.fn()
// The per-list send limiter: keys it was asked about, and keys it refuses.
const listLimitKeys: string[] = []
const blockedListKeys = new Set<string>()
const safeLimitMock = vi.fn()

vi.mock('payload', () => ({ getPayload: vi.fn(async () => fakePayload) }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name in jar ? { name, value: jar[name] } : undefined),
  }),
}))
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))
vi.mock('@/app/lib/ratelimit', () => ({
  favoritesStartRatelimit: { name: 'start' },
  favoritesSendRatelimit: { name: 'send' },
  favoritesListSendRatelimit: {
    limit: async (key: string) => {
      listLimitKeys.push(key)
      if (failListLimit) throw new Error('redis unreachable')
      return { success: !blockedListKeys.has(key) }
    },
  },
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  safeLimit: (...args: unknown[]) => safeLimitMock(...args),
}))

const { GET: getList, DELETE: leaveList } = await import('./route')
const { POST: start } = await import('./start/route')
const { POST: toggle } = await import('./toggle/route')
const { POST: send } = await import('./send/route')

const SLUG = 'smith-wedding'
const ORIGIN = 'https://tynnellhollinsphotography.com'

function photo(id: number) {
  return {
    id,
    filename: `smith-${id}.jpg`,
    sizes: { thumbnail: { url: `https://media.example/smith-${id}-thumb.jpg` } },
  }
}

// The fake ignores `depth`, so photos are always full objects, as they are
// when a route asks for depth 1. Routes must cope with both shapes anyway.
function gallery(overrides: Record<string, unknown> = {}): Row {
  return {
    id: 5,
    slug: SLUG,
    title: 'Smith Wedding',
    status: 'published',
    favoritesEnabled: true,
    favoritesLimit: null,
    isPasswordProtected: false,
    password: null,
    expiresAt: null,
    photos: [1, 2, 3, 4].map(id => ({ photo: photo(id) })),
    ...overrides,
  }
}

function keepCookies(res: NextResponse) {
  for (const c of res.cookies.getAll()) {
    if (c.value === '' || c.maxAge === 0) delete jar[c.name]
    else jar[c.name] = c.value
  }
}

async function post(handler: (req: NextRequest) => Promise<NextResponse>, path: string, body: unknown) {
  const res = await handler(new NextRequest(`${ORIGIN}/api/favorites${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }))
  keepCookies(res)
  return res
}

const startAs = (name = 'Jane Smith', email = 'jane@example.com', slug = SLUG) =>
  post(start, '/start', { gallery: slug, name, email })
const heart = (photoId: number, favorited = true) =>
  post(toggle, '/toggle', { gallery: SLUG, photoId, favorited })
const sendToTynnell = () => post(send, '/send', { gallery: SLUG })
const read = async () => {
  const res = await getList(new NextRequest(`${ORIGIN}/api/favorites?gallery=${SLUG}`))
  return { res, body: await res.json() }
}

beforeEach(() => {
  galleries = [gallery()]
  lists = []
  nextListId = 1
  jar = {}
  lockQueues.clear()
  heldLocks.clear()
  lockStatements.length = 0
  listLimitKeys.length = 0
  blockedListKeys.clear()
  failListLimit = false
  vi.clearAllMocks()
  safeLimitMock.mockResolvedValue({ success: true })
  sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null })
})

describe('POST /api/favorites/start', () => {
  it('starts an empty list for the client and remembers it in a signed, httpOnly cookie', async () => {
    const res = await startAs()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      list: { name: 'Jane Smith', email: 'jane@example.com', photoIds: [], sentAt: null, unsentChanges: false },
      limit: null,
    })
    const cookie = res.cookies.get(`fav_${SLUG}`)
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'strict', path: '/' })
    expect(lists).toHaveLength(1)
    expect(lists[0]).toMatchObject({ gallery: 5, clientEmail: 'jane@example.com', clientName: 'Jane Smith' })
  })

  it('picks the same list back up on another device, however the email is typed', async () => {
    await startAs()
    await heart(2)
    jar = {}

    const res = await startAs('Jane', '  JANE@Example.com ')
    expect(res.status).toBe(200)
    expect((await res.json()).list).toMatchObject({ name: 'Jane Smith', photoIds: [2] })
    expect(lists).toHaveLength(1)
  })

  it('gives a second person in the same gallery their own list', async () => {
    await startAs()
    await heart(2)
    jar = {}

    const res = await startAs('John Smith', 'john@example.com')
    expect((await res.json()).list.photoIds).toEqual([])
    expect(lists).toHaveLength(2)
  })

  it('rejects an invalid email', async () => {
    const res = await startAs('Jane', 'not-an-email')
    expect(res.status).toBe(400)
    expect(lists).toHaveLength(0)
  })

  it('reports an email the database rejects as an invalid email, not a server error', async () => {
    fakePayload.create.mockRejectedValueOnce(Object.assign(new Error('The following field is invalid: clientEmail'), { name: 'ValidationError' }))
    const res = await startAs('Jane', 'jane@gmail..com')
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/valid email/i)
  })

  it('rejects a missing or overlong name', async () => {
    expect((await startAs('   ')).status).toBe(400)
    expect((await startAs('x'.repeat(101))).status).toBe(400)
    expect(lists).toHaveLength(0)
  })

  it('refuses when the gallery does not have favorites turned on', async () => {
    galleries = [gallery({ favoritesEnabled: false })]
    expect((await startAs()).status).toBe(403)
    expect(lists).toHaveLength(0)
  })

  it('treats a draft or unknown gallery as not found', async () => {
    galleries = [gallery({ status: 'draft' })]
    expect((await startAs()).status).toBe(404)
    expect((await startAs('Jane', 'jane@example.com', 'no-such-gallery')).status).toBe(404)
  })

  it('refuses an expired gallery', async () => {
    galleries = [gallery({ expiresAt: '2020-01-01' })]
    expect((await startAs()).status).toBe(403)
  })

  it('refuses a password-protected gallery until the password has been entered', async () => {
    galleries = [gallery({ isPasswordProtected: true, password: '$2a$04$hash' })]
    expect((await startAs()).status).toBe(401)
    expect(lists).toHaveLength(0)
  })

  it('is rate limited', async () => {
    safeLimitMock.mockResolvedValue({ success: false })
    expect((await startAs()).status).toBe(429)
    expect(lists).toHaveLength(0)
  })
})

describe('POST /api/favorites/toggle', () => {
  it('refuses a browser that has not started a list', async () => {
    expect((await heart(1)).status).toBe(401)
  })

  it('adds and removes favorites', async () => {
    await startAs()
    expect(await (await heart(1)).json()).toMatchObject({ list: { photoIds: [1] } })
    expect(await (await heart(3)).json()).toMatchObject({ list: { photoIds: [1, 3] } })
    expect(await (await heart(1, false)).json()).toMatchObject({ list: { photoIds: [3] } })
    expect(lists[0].photoIds).toEqual([3])
  })

  it('keeps both hearts when two devices on the same list press at the same moment', async () => {
    await startAs()
    const [a, b] = await Promise.all([heart(2), heart(3)])
    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
    expect([...(lists[0].photoIds as number[])].sort()).toEqual([2, 3])
  })

  it('never lets two simultaneous hearts slip past the limit', async () => {
    galleries = [gallery({ favoritesLimit: 1 })]
    await startAs()
    const statuses = (await Promise.all([heart(2), heart(3)])).map(r => r.status).sort()
    expect(statuses).toEqual([200, 409])
    expect(lists[0].photoIds as number[]).toHaveLength(1)
  })

  it('locks only the list being changed, and lets go of the lock afterwards', async () => {
    await startAs()
    await heart(1)
    await heart(99)
    expect(new Set(lockStatements).size).toBe(1)
    expect(lockStatements[0]).toMatch(/^SELECT pg_advisory_xact_lock\(\d+, 1\)$/)
    expect(heldLocks.size).toBe(0)
    expect(Object.keys(fakeDb.sessions)).toEqual([])
  })

  it('still saves the heart when the lock cannot be taken', async () => {
    await startAs()
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    fakeDb.execute.mockRejectedValueOnce(new Error('function pg_advisory_xact_lock does not exist'))

    const res = await heart(2)
    expect(res.status).toBe(200)
    expect(lists[0].photoIds).toEqual([2])
    // The failed transaction is closed, and the failure is not silent.
    expect(fakeDb.rollbackTransaction).toHaveBeenCalledTimes(1)
    expect(Object.keys(fakeDb.sessions)).toEqual([])
    expect(logged).toHaveBeenCalled()
    logged.mockRestore()
  })

  it('refuses a photo that is not in the gallery', async () => {
    await startAs()
    expect((await heart(99)).status).toBe(400)
    expect(lists[0].photoIds ?? []).toEqual([])
  })

  it('refuses a new favorite past the gallery limit, and says what the limit is', async () => {
    galleries = [gallery({ favoritesLimit: 2 })]
    await startAs()
    await heart(1)
    await heart(2)
    const res = await heart(3)
    expect(res.status).toBe(409)
    expect((await res.json()).error).toContain('2')
    expect(lists[0].photoIds).toEqual([1, 2])
  })

  it('refuses a cookie whose list has since been deleted', async () => {
    await startAs()
    lists = []
    expect((await heart(1)).status).toBe(401)
  })

  it('stops working once favorites are turned off for the gallery', async () => {
    await startAs()
    galleries = [gallery({ favoritesEnabled: false })]
    expect((await heart(1)).status).toBe(403)
  })

  it('rejects a request without a real photo id or a yes/no', async () => {
    await startAs()
    expect((await post(toggle, '/toggle', { gallery: SLUG, photoId: 'abc', favorited: true })).status).toBe(400)
    expect((await post(toggle, '/toggle', { gallery: SLUG, photoId: 1 })).status).toBe(400)
  })
})

describe('GET /api/favorites', () => {
  it('reports no list for a browser that has not started one', async () => {
    const { res, body } = await read()
    expect(res.status).toBe(200)
    expect(body).toEqual({ list: null, limit: null })
  })

  it("returns the client's list and the gallery limit", async () => {
    galleries = [gallery({ favoritesLimit: 10 })]
    await startAs()
    await heart(4)
    const { body } = await read()
    expect(body).toEqual({
      list: { name: 'Jane Smith', email: 'jane@example.com', photoIds: [4], sentAt: null, unsentChanges: true },
      limit: 10,
    })
  })

  it('leaves out a favorite whose photo has since been taken out of the gallery', async () => {
    await startAs()
    await heart(1)
    await heart(4)
    galleries = [gallery({ photos: [1, 2, 3].map(id => ({ photo: photo(id) })) })]
    expect((await read()).body.list.photoIds).toEqual([1])
  })

  it('copes with a gallery whose photos are bare ids', async () => {
    await startAs()
    await heart(2)
    galleries = [gallery({ photos: [{ photo: 1 }, { photo: 2 }] })]
    expect((await read()).body.list.photoIds).toEqual([2])
  })

  it('is never cached, since the answer depends on the cookie', async () => {
    const { res } = await read()
    expect(res.headers.get('cache-control')).toContain('no-store')
  })
})

describe('DELETE /api/favorites', () => {
  it('forgets the list on this device without deleting it', async () => {
    await startAs()
    await heart(1)
    const res = await leaveList(new NextRequest(`${ORIGIN}/api/favorites?gallery=${SLUG}`, { method: 'DELETE' }))
    keepCookies(res)
    expect(res.status).toBe(200)
    expect(jar).toEqual({})
    expect((await read()).body.list).toBeNull()
    expect(lists).toHaveLength(1)
  })
})

describe('POST /api/favorites/send', () => {
  it('refuses a browser that has not started a list', async () => {
    expect((await sendToTynnell()).status).toBe(401)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('refuses to send an empty list', async () => {
    await startAs()
    expect((await sendToTynnell()).status).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('emails Tynnell the selection, with replies going to the client', async () => {
    await startAs()
    await heart(3)
    await heart(1)
    const res = await sendToTynnell()
    expect(res.status).toBe(200)

    expect(sendMock).toHaveBeenCalledTimes(1)
    const email = sendMock.mock.calls[0][0]
    expect(email.to).toBe('tynnell@example.com')
    expect(email.replyTo).toBe('jane@example.com')
    expect(email.subject).toContain('Jane Smith')
    expect(email.subject).toContain('Smith Wedding')
    expect(email.html).toContain('smith-1.jpg')
    expect(email.html).toContain('smith-3.jpg')
    expect(email.html).not.toContain('smith-2.jpg')
    expect(email.html).toContain('https://media.example/smith-1-thumb.jpg')
    // Links to the custom gallery editor, never the raw Payload admin.
    expect(email.html).toContain(`${ORIGIN}/gallery-editor/5`)
    expect(email.html).not.toContain('/admin')
  })

  it('records when the list was sent and what was in it', async () => {
    await startAs()
    await heart(2)
    const body = await (await sendToTynnell()).json()
    expect(body.list.unsentChanges).toBe(false)
    expect(typeof body.list.sentAt).toBe('string')
    expect(lists[0].sentPhotoIds).toEqual([2])
    expect(lists[0].sentAt).toBe(body.list.sentAt)
  })

  it('flags changes made after sending, and tells Tynnell what changed on the next send', async () => {
    await startAs()
    await heart(1)
    await heart(2)
    await sendToTynnell()

    await heart(1, false)
    await heart(4)
    expect((await read()).body.list.unsentChanges).toBe(true)

    await sendToTynnell()
    const html: string = sendMock.mock.calls[1][0].html
    expect(html).toMatch(/Added since[^]*smith-4\.jpg/)
    expect(html).toMatch(/Removed since[^]*smith-1\.jpg/)
    expect(sendMock.mock.calls[1][0].subject).toContain('updated')
  })

  it('does not email Tynnell again when nothing has changed since the last send', async () => {
    await startAs()
    await heart(2)
    await sendToTynnell()
    const first = lists[0].sentAt

    const res = await sendToTynnell()
    expect(res.status).toBe(200)
    expect((await res.json()).list.unsentChanges).toBe(false)
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(lists[0].sentAt).toBe(first)
  })

  it('limits how often one list can be sent, whatever address the requests come from', async () => {
    await startAs()
    await heart(2)
    blockedListKeys.add('1')
    expect((await sendToTynnell()).status).toBe(429)
    expect(sendMock).not.toHaveBeenCalled()
    expect(listLimitKeys).toEqual(['1'])
  })

  it('sends nothing when the per-list limit cannot be checked', async () => {
    await startAs()
    await heart(2)
    failListLimit = true
    expect((await sendToTynnell()).status).toBe(429)
    expect(sendMock).not.toHaveBeenCalled()
    expect(lists[0].sentAt ?? null).toBeNull()
  })

  it('does not mark the list as sent when the email fails', async () => {
    await startAs()
    await heart(2)
    sendMock.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect((await sendToTynnell()).status).toBe(502)
    expect(lists[0].sentAt ?? null).toBeNull()
  })

  it('escapes the client name, which is typed by a stranger', async () => {
    await startAs('<img src=x onerror=alert(1)>')
    await heart(2)
    await sendToTynnell()
    const email = sendMock.mock.calls[0][0]
    expect(email.html).not.toContain('<img src=x')
    expect(email.html).toContain('&lt;img src=x')
  })

  it('escapes the thumbnail address like every other value in the email', async () => {
    const odd = { id: 2, filename: 'smith-2.jpg', sizes: { thumbnail: { url: 'https://media.example/a"b<c>.jpg' } } }
    galleries = [gallery({ photos: [{ photo: odd }] })]
    await startAs()
    await heart(2)
    await sendToTynnell()
    const html: string = sendMock.mock.calls[0][0].html
    expect(html).not.toContain('a"b<c>.jpg')
    expect(html).toContain('a&quot;b&lt;c&gt;.jpg')
  })

  it('is rate limited', async () => {
    await startAs()
    await heart(2)
    safeLimitMock.mockResolvedValue({ success: false })
    expect((await sendToTynnell()).status).toBe(429)
    expect(sendMock).not.toHaveBeenCalled()
  })
})
