// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const authMock = vi.fn()
const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`)
})

vi.mock('payload', () => ({ getPayload: vi.fn().mockResolvedValue({ auth: authMock }) }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/headers', () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }))
vi.mock('next/navigation', () => ({ redirect: (url: string) => redirectMock(url) }))

const { default: NewCollectionPage } = await import('./page')

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
})

// TYN-311: /gallery-editor/new is a Studio page, like the editor it leads to.
describe('/gallery-editor/new', () => {
  it('sends a signed-out visitor to the login instead of showing the form', async () => {
    authMock.mockResolvedValue({ user: null })

    await expect(NewCollectionPage()).rejects.toThrow('NEXT_REDIRECT:/admin/login')
  })

  it('shows the Create New Collection form to a signed-in user', async () => {
    authMock.mockResolvedValue({ user: { id: 1 } })

    render(await NewCollectionPage())

    expect(screen.getByRole('heading', { name: /create new collection/i })).toBeInTheDocument()
  })
})
