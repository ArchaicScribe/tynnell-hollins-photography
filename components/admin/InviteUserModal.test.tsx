// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InviteUserModal } from './InviteUserModal'

afterEach(() => {
  vi.unstubAllGlobals()
})

async function openAndFill(user: ReturnType<typeof userEvent.setup>, name: string, email: string) {
  await user.click(screen.getByRole('button', { name: /invite user/i }))
  await user.type(screen.getByLabelText(/full name/i), name)
  await user.type(screen.getByLabelText(/^email$/i), email)
}

describe('InviteUserModal', () => {
  it('is closed until the trigger button is clicked', () => {
    render(<InviteUserModal />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the form on click, with name and email fields', async () => {
    const user = userEvent.setup()
    render(<InviteUserModal />)

    await user.click(screen.getByRole('button', { name: /invite user/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
  })

  it('shows a success message naming the invited user after a successful submit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) }))
    const user = userEvent.setup()
    render(<InviteUserModal />)

    await openAndFill(user, 'Jane Doe', 'jane@example.com')
    await user.click(screen.getByRole('button', { name: /send invite/i }))

    expect(await screen.findByText('Invite sent')).toBeInTheDocument()
    expect(screen.getByText(/jane doe will receive an email at jane@example\.com/i)).toBeInTheDocument()
  })

  it('shows the server-provided error message when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'A user with that email already exists.' }),
    }))
    const user = userEvent.setup()
    render(<InviteUserModal />)

    await openAndFill(user, 'Jane Doe', 'jane@example.com')
    await user.click(screen.getByRole('button', { name: /send invite/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('A user with that email already exists.')
  })

  it('shows a generic error message when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const user = userEvent.setup()
    render(<InviteUserModal />)

    await openAndFill(user, 'Jane Doe', 'jane@example.com')
    await user.click(screen.getByRole('button', { name: /send invite/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Please try again.')
  })

  it('closes when Cancel is clicked, discarding the entered values', async () => {
    const user = userEvent.setup()
    render(<InviteUserModal />)

    await user.click(screen.getByRole('button', { name: /invite user/i }))
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe')
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /invite user/i }))
    expect(screen.getByLabelText(/full name/i)).toHaveValue('')
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(<InviteUserModal />)

    await user.click(screen.getByRole('button', { name: /invite user/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
