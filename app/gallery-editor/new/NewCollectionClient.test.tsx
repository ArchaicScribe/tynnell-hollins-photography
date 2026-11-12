// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewCollectionClient } from './NewCollectionClient'

type Req = { method: string; url: string; body?: Record<string, unknown> }
let requests: Req[]
let createResponse: () => Response
let presetCategory: string | null
let presetGate: Promise<void> | null

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  const method = init?.method ?? 'GET'
  requests.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined })
  if (url.startsWith('/api/globals/gallery-presets')) {
    if (presetGate) await presetGate
    return new Response(JSON.stringify({ defaultCategory: presetCategory }), { status: 200 })
  }
  if (url === '/api/galleries' && method === 'POST') return createResponse()
  return new Response('{}', { status: 404 })
})

const creates = () => requests.filter(r => r.method === 'POST' && r.url === '/api/galleries')

function setup() {
  const navigate = vi.fn()
  const user = userEvent.setup()
  render(<NewCollectionClient navigate={navigate} />)
  return { navigate, user }
}

const nameField = () => screen.getByRole('textbox', { name: /collection name/i })
const createButton = () => screen.getByRole('button', { name: /create collection/i })

beforeEach(() => {
  requests = []
  presetCategory = null
  presetGate = null
  createResponse = () => new Response(JSON.stringify({ doc: { id: 42 } }), { status: 201 })
  fetchMock.mockClear()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// TYN-311: Pixieset's full-page "Create New Collection".
describe('Create New Collection page', () => {
  it('has the name, event date and category fields and a Create Collection button', () => {
    setup()

    expect(screen.getByRole('heading', { name: /create new collection/i })).toBeInTheDocument()
    expect(nameField()).toBeInTheDocument()
    expect(screen.getByLabelText(/event date/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument()
    expect(createButton()).toBeInTheDocument()
  })

  it('links back to the collections list', () => {
    setup()

    expect(screen.getByRole('link', { name: /collections/i })).toHaveAttribute('href', '/builder?product=portfolio')
  })

  it('cannot create until the collection has a name', async () => {
    const { user } = setup()
    expect(createButton()).toBeDisabled()

    await user.type(nameField(), '   ')
    expect(createButton()).toBeDisabled()

    await user.type(nameField(), 'Smith Wedding')
    expect(createButton()).toBeEnabled()
  })

  it('starts on the category chosen in Gallery Presets', async () => {
    presetCategory = 'families'
    setup()

    await waitFor(() => expect(screen.getByRole('combobox', { name: /category/i })).toHaveValue('families'))
  })

  it('creates the collection with its name, category and event date, then opens its editor', async () => {
    const { user, navigate } = setup()

    await user.type(nameField(), 'Smith Wedding')
    await user.selectOptions(screen.getByRole('combobox', { name: /category/i }), 'weddings')
    await user.type(screen.getByLabelText(/event date/i), '2026-06-14')
    await user.click(createButton())

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/gallery-editor/42'))
    expect(creates()).toHaveLength(1)
    expect(creates()[0].body).toEqual({ title: 'Smith Wedding', category: 'weddings', eventDate: '2026-06-14' })
  })

  it('does not send a status, so Gallery Presets decide it', async () => {
    const { user } = setup()

    await user.type(nameField(), 'Smith Wedding')
    await user.click(createButton())

    await waitFor(() => expect(creates()).toHaveLength(1))
    expect(creates()[0].body).not.toHaveProperty('status')
    expect(creates()[0].body).not.toHaveProperty('eventDate')
  })

  it('creates when Enter is pressed in the name field', async () => {
    const { user, navigate } = setup()

    await user.type(nameField(), 'Smith Wedding{Enter}')

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/gallery-editor/42'))
  })

  it('shows the reason and lets the user try again when the create fails', async () => {
    createResponse = () =>
      new Response(JSON.stringify({ errors: [{ message: 'The following field is invalid: slug' }] }), { status: 400 })
    const { user, navigate } = setup()

    await user.type(nameField(), 'Smith Wedding')
    await user.click(createButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(/slug/i)
    expect(navigate).not.toHaveBeenCalled()
    expect(createButton()).toBeEnabled()
  })

  it('reports a connection problem instead of failing silently', async () => {
    createResponse = () => { throw new Error('offline') }
    const { user } = setup()

    await user.type(nameField(), 'Smith Wedding')
    await user.click(createButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(/connection/i)
    expect(createButton()).toBeEnabled()
  })

  it('keeps the category the user picked when the presets arrive late', async () => {
    let release!: () => void
    presetGate = new Promise<void>(resolve => { release = resolve })
    presetCategory = 'weddings'
    const { user } = setup()

    await user.selectOptions(screen.getByRole('combobox', { name: /category/i }), 'families')
    release()
    await waitFor(() => expect(requests.some(r => r.url.startsWith('/api/globals/gallery-presets'))).toBe(true))
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(screen.getByRole('combobox', { name: /category/i })).toHaveValue('families')
  })

  it('does not offer a second create when the new collection could not be opened', async () => {
    createResponse = () => new Response(JSON.stringify({ doc: {} }), { status: 201 })
    const { user } = setup()

    await user.type(nameField(), 'Smith Wedding')
    await user.click(createButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be opened/i)
    expect(createButton()).toBeDisabled()
    expect(creates()).toHaveLength(1)
  })
})
