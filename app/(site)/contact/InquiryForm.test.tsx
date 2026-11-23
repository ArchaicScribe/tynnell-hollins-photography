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

// The wedding / portrait switch is a tab list, so it follows the tabs pattern: only the
// selected tab is in the Tab order, the arrow keys move between tabs, and each tab names
// the panel it controls.
describe('InquiryForm - the tabs are keyboard and screen reader friendly', () => {
  const wedding = () => screen.getByRole('tab', { name: 'Wedding inquiry' })
  const portrait = () => screen.getByRole('tab', { name: 'Portrait inquiry' })

  it('puts only the selected tab in the Tab order', () => {
    render(<InquiryForm kind="choice" />)

    expect(wedding()).toHaveAttribute('tabindex', '0')
    expect(portrait()).toHaveAttribute('tabindex', '-1')
  })

  it('links each tab to the panel holding the form, and the panel back to the selected tab', () => {
    render(<InquiryForm kind="choice" />)

    const panel = screen.getByRole('tabpanel')

    expect(wedding()).toHaveAttribute('aria-controls', panel.id)
    expect(portrait()).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', wedding().id)
    expect(panel).toContainElement(screen.getByRole('button', { name: 'Send Inquiry' }))
  })

  it('points the panel at the new tab after a switch', async () => {
    const user = userEvent.setup()
    render(<InquiryForm kind="choice" />)

    await user.click(portrait())

    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', portrait().id)
  })

  it('moves to the next tab with the right arrow, taking focus along', async () => {
    const user = userEvent.setup()
    render(<InquiryForm kind="choice" />)

    wedding().focus()
    await user.keyboard('{ArrowRight}')

    expect(portrait()).toHaveAttribute('aria-selected', 'true')
    expect(portrait()).toHaveFocus()
    expect(portrait()).toHaveAttribute('tabindex', '0')
    expect(wedding()).toHaveAttribute('tabindex', '-1')
  })

  it('wraps round with the arrow keys, and Home and End jump to the ends', async () => {
    const user = userEvent.setup()
    render(<InquiryForm kind="choice" />)

    wedding().focus()
    await user.keyboard('{ArrowLeft}')
    expect(portrait()).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Home}')
    expect(wedding()).toHaveAttribute('aria-selected', 'true')
    expect(wedding()).toHaveFocus()

    await user.keyboard('{End}')
    expect(portrait()).toHaveAttribute('aria-selected', 'true')
  })

  it('ignores the arrow keys while a request is in flight', async () => {
    fetchMock.mockReturnValue(new Promise<Response>(() => {}))
    const user = userEvent.setup()
    render(<InquiryForm kind="choice" />)
    await user.type(screen.getByLabelText(/^Name/i), 'Ana')
    await user.type(screen.getByLabelText(/^Email/i), 'ana@example.com')
    await user.type(screen.getByLabelText(/Partner.s name/i), 'Sam')
    await user.type(screen.getByLabelText(/Message/i), 'Hi')
    await user.click(screen.getByRole('button', { name: 'Send Inquiry' }))

    wedding().focus()
    await user.keyboard('{ArrowRight}')

    expect(wedding()).toHaveAttribute('aria-selected', 'true')
  })

  it('has no tab list and no tab panel when the form is fixed to one kind', () => {
    render(<InquiryForm kind="wedding" />)

    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.queryByRole('tabpanel')).toBeNull()
  })

  it('keeps every id on a page with two forms unique', () => {
    const { container } = render(<><InquiryForm kind="choice" /><InquiryForm kind="choice" /></>)

    const ids = [...container.querySelectorAll('[id]')].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('InquiryForm - robustness', () => {
  it('ignores a tab switch while a request is in flight', async () => {
    let finish!: (r: Response) => void
    fetchMock.mockReturnValue(new Promise<Response>((r) => { finish = r }))
    const user = userEvent.setup()
    render(<InquiryForm kind="choice" />)

    await user.type(screen.getByLabelText(/^Name/i), 'Ana')
    await user.type(screen.getByLabelText(/^Email/i), 'ana@example.com')
    await user.type(screen.getByLabelText(/Partner.s name/i), 'Sam')
    await user.type(screen.getByLabelText(/Message/i), 'Hi')
    await user.click(screen.getByRole('button', { name: 'Send Inquiry' }))
    await user.click(screen.getByRole('tab', { name: 'Portrait inquiry' }))

    expect(screen.getByRole('tab', { name: 'Wedding inquiry' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: /Sending/ })).toBeDisabled()
    finish(new Response(JSON.stringify({ success: true }), { status: 200 }))
  })

  it('gives two forms on one page different input ids', () => {
    const { container } = render(<><InquiryForm kind="wedding" /><InquiryForm kind="portrait" /></>)

    const ids = [...container.querySelectorAll('[id]')].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('InquiryForm - Turnstile token is single use', () => {
  it('gets a fresh token after a rejected submission, not the spent one', async () => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site-key')
    let mounts = 0
    vi.doMock('@/app/components/Turnstile/Turnstile', async () => {
      const React = await import('react')
      return {
        default: function FakeTurnstile({ onVerify }: { onVerify: (t: string) => void }) {
          const [n] = React.useState(() => ++mounts)
          React.useEffect(() => { onVerify(`token-${n}`) }, [n, onVerify])
          return <div data-testid="turnstile" />
        },
      }
    })
    const { default: Form } = await import('./InquiryForm')
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'That date is blocked.' }), { status: 400 }))
    const user = userEvent.setup()
    render(<Form kind="wedding" />)

    await user.type(screen.getByLabelText(/^Name/i), 'Ana')
    await user.type(screen.getByLabelText(/^Email/i), 'ana@example.com')
    await user.type(screen.getByLabelText(/Partner.s name/i), 'Sam')
    await user.type(screen.getByLabelText(/Message/i), 'Hi')
    await user.click(screen.getByRole('button', { name: 'Send Inquiry' }))
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'Send Inquiry' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body)).turnstileToken).toBe('token-1')
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body)).turnstileToken).toBe('token-2')
    vi.doUnmock('@/app/components/Turnstile/Turnstile')
    vi.unstubAllEnvs()
  })
})
