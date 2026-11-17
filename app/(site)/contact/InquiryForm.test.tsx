// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InquiryForm from './InquiryForm'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

function sentBody() {
  return JSON.parse(String(fetchMock.mock.calls[0][1].body))
}

describe('InquiryForm - wedding', () => {
  it('asks for the partner name and location, and has no phone or contact-preference field', () => {
    render(<InquiryForm kind="wedding" />)

    expect(screen.getByLabelText(/Partner.s name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Wedding location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Wedding date/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Phone/i)).toBeNull()
    expect(screen.queryByLabelText(/Preferred Contact/i)).toBeNull()
  })

  it('posts the kind and what was typed to /api/contact', async () => {
    const user = userEvent.setup()
    render(<InquiryForm kind="wedding" />)

    await user.type(screen.getByLabelText(/^Name/i), 'Ana Reyes')
    await user.type(screen.getByLabelText(/^Email/i), 'ana@example.com')
    await user.type(screen.getByLabelText(/Partner.s name/i), 'Sam Ortiz')
    await user.type(screen.getByLabelText(/Message/i), 'We are getting married!')
    await user.click(screen.getByRole('button', { name: 'Send Inquiry' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(fetchMock.mock.calls[0][0]).toBe('/api/contact')
    expect(sentBody()).toMatchObject({ kind: 'wedding', name: 'Ana Reyes', email: 'ana@example.com', partnerName: 'Sam Ortiz', message: 'We are getting married!', website: '' })
  })

  it('shows the thank-you message after a successful send', async () => {
    const user = userEvent.setup()
    render(<InquiryForm kind="wedding" />)

    await user.type(screen.getByLabelText(/^Name/i), 'Ana')
    await user.type(screen.getByLabelText(/^Email/i), 'ana@example.com')
    await user.type(screen.getByLabelText(/Partner.s name/i), 'Sam')
    await user.type(screen.getByLabelText(/Message/i), 'Hi')
    await user.click(screen.getByRole('button', { name: 'Send Inquiry' }))

    expect(await screen.findByText('Thank you.')).toBeInTheDocument()
  })

  it('shows the server message when it rejects the inquiry', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'That date is blocked.' }), { status: 400 }))
    const user = userEvent.setup()
    render(<InquiryForm kind="wedding" />)

    await user.type(screen.getByLabelText(/^Name/i), 'Ana')
    await user.type(screen.getByLabelText(/^Email/i), 'ana@example.com')
    await user.type(screen.getByLabelText(/Partner.s name/i), 'Sam')
    await user.type(screen.getByLabelText(/Message/i), 'Hi')
    await user.click(screen.getByRole('button', { name: 'Send Inquiry' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('That date is blocked.')
  })

  it('keeps the honeypot field hidden from people and screen readers', () => {
    const { container } = render(<InquiryForm kind="wedding" />)

    const trap = container.querySelector('input[name="website"]')
    expect(trap).not.toBeNull()
    expect(trap!.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('passes the date bounds to the date input', () => {
    render(<InquiryForm kind="wedding" minDate="2027-01-01" maxDate="2028-01-01" />)

    expect(screen.getByLabelText(/Wedding date/i)).toHaveAttribute('min', '2027-01-01')
    expect(screen.getByLabelText(/Wedding date/i)).toHaveAttribute('max', '2028-01-01')
  })
})

describe('InquiryForm - portrait', () => {
  it('offers the four sessions and no partner field', () => {
    render(<InquiryForm kind="portrait" />)

    const options = [...screen.getByLabelText(/Which session/i).querySelectorAll('option')].map((o) => o.textContent)
    expect(options).toEqual(expect.arrayContaining(['Couple', 'Maternity', 'Newborn', 'Family']))
    expect(screen.queryByLabelText(/Partner.s name/i)).toBeNull()
  })
})

describe('InquiryForm - visitor chooses', () => {
  it('starts on the wedding form and switches to the portrait form, then posts that kind', async () => {
    const user = userEvent.setup()
    render(<InquiryForm kind="choice" />)

    expect(screen.getByRole('tab', { name: 'Wedding inquiry' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText(/Partner.s name/i)).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Portrait inquiry' }))
    expect(screen.getByRole('tab', { name: 'Portrait inquiry' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByLabelText(/Partner.s name/i)).toBeNull()

    await user.type(screen.getByLabelText(/^Name/i), 'Ana')
    await user.type(screen.getByLabelText(/^Email/i), 'ana@example.com')
    await user.selectOptions(screen.getByLabelText(/Which session/i), 'Newborn')
    await user.type(screen.getByLabelText(/Message/i), 'Hi')
    await user.click(screen.getByRole('button', { name: 'Send Inquiry' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(sentBody()).toMatchObject({ kind: 'portrait', sessionType: 'Newborn' })
  })
})
