// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UsersGridView } from './UsersGridView'

function mockFetchOnce(response: unknown, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('UsersGridView', () => {
  it('renders a card per user with name, email, and initials', async () => {
    mockFetchOnce({
      docs: [
        { id: 1, email: 'hello@tynnellhollinsphotography.com', name: 'Tynnell Hollins', mustChangePassword: false },
        { id: 2, email: 'xandermv2@gmail.com', name: null, mustChangePassword: false },
      ],
    })

    render(<UsersGridView />)

    expect(await screen.findByText('Tynnell Hollins')).toBeInTheDocument()
    expect(screen.getByText('hello@tynnellhollinsphotography.com')).toBeInTheDocument()
    expect(screen.getByText('<No Full Name>')).toBeInTheDocument()
    expect(screen.getByText('xandermv2@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('TH')).toBeInTheDocument()
    // No name -> falls back to first letter of email, uppercased.
    expect(screen.getByText('X')).toBeInTheDocument()
    expect(screen.getByText('2 users')).toBeInTheDocument()
  })

  it('shows the "must change password" badge only for users pending a reset', async () => {
    mockFetchOnce({
      docs: [{ id: 1, email: 'new@example.com', name: 'New User', mustChangePassword: true }],
    })

    render(<UsersGridView />)

    expect(await screen.findByText('Password reset pending')).toBeInTheDocument()
  })

  it('shows an empty state when there are no users', async () => {
    mockFetchOnce({ docs: [] })

    render(<UsersGridView />)

    expect(await screen.findByText('No users yet.')).toBeInTheDocument()
  })

  it('shows an error message when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    render(<UsersGridView />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load users/i)
  })

  it('shows an error message (not an empty state) on a non-2xx response', async () => {
    // A session expiry or server error still returns a parseable JSON body
    // (e.g. { error: '...' }), so this must be caught via response.ok rather
    // than relying on r.json() to throw - otherwise it silently renders as
    // "no users" instead of surfacing the failure.
    mockFetchOnce({ error: 'Unauthorized' }, false)

    render(<UsersGridView />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load users/i)
    expect(screen.queryByText('No users yet.')).not.toBeInTheDocument()
  })

  it('links each card to the document edit view', async () => {
    mockFetchOnce({
      docs: [{ id: 7, email: 'a@example.com', name: 'A User', mustChangePassword: false }],
    })

    render(<UsersGridView />)

    const link = await screen.findByTitle('A User')
    expect(link).toHaveAttribute('href', '/admin/collections/users/7')
  })
})
