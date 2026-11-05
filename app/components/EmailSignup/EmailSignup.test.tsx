// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import EmailSignupForm from './EmailSignupForm'
import { config } from '@/app/builder/puck.config'

const fetchMock = vi.fn()

function reply(status: number, body: unknown) {
  fetchMock.mockResolvedValue({ ok: status < 400, status, json: async () => body })
}

function fillAndSubmit(email = 'jane@example.com', firstName = 'Jane') {
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: firstName } })
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: email } })
  fireEvent.click(screen.getByRole('button', { name: 'Send me the guide' }))
}

describe('EmailSignupForm', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock))
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('sends the name, email and kind of signup to /api/subscribe', async () => {
    reply(200, { success: true, freebieSent: true })
    render(<EmailSignupForm kind="freebie" buttonText="Send me the guide" successMessage="Check your inbox." />)

    fillAndSubmit()

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/subscribe')
    expect(JSON.parse(init.body)).toMatchObject({ email: 'jane@example.com', firstName: 'Jane', kind: 'freebie', website: '' })
  })

  it('replaces the form with the success message once signed up', async () => {
    reply(200, { success: true, freebieSent: true })
    render(<EmailSignupForm kind="freebie" buttonText="Send me the guide" successMessage="Check your inbox." />)

    fillAndSubmit()

    expect(await screen.findByText('Check your inbox.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send me the guide' })).not.toBeInTheDocument()
  })

  it('does not promise a guide in the inbox when none was sent', async () => {
    // Before the guide exists, the signup still counts but no email goes out.
    reply(200, { success: true, freebieSent: false })
    render(<EmailSignupForm kind="freebie" buttonText="Send me the guide" successMessage="Check your inbox." />)

    fillAndSubmit()

    expect(await screen.findByText(/you're on the list/i)).toBeInTheDocument()
    expect(screen.queryByText('Check your inbox.')).not.toBeInTheDocument()
  })

  it('shows the error the server gives and keeps what was typed', async () => {
    reply(429, { error: 'Too many requests. Please try again later.' })
    render(<EmailSignupForm kind="newsletter" buttonText="Send me the guide" successMessage="Thanks!" />)

    fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests')
    expect(screen.getByLabelText(/^email/i)).toHaveValue('jane@example.com')
  })

  it('shows a general error when the request itself fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    render(<EmailSignupForm kind="newsletter" buttonText="Send me the guide" successMessage="Thanks!" />)

    fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i)
  })

  it('cannot be sent twice while the first request is still going', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    render(<EmailSignupForm kind="newsletter" buttonText="Send me the guide" successMessage="Thanks!" />)

    fillAndSubmit()

    await waitFor(() => expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled())
  })

  it('keeps the honeypot field away from people and screen readers', () => {
    render(<EmailSignupForm kind="newsletter" buttonText="Send me the guide" successMessage="Thanks!" />)

    const honeypot = document.querySelector('input[name="website"]') as HTMLInputElement
    expect(honeypot).toHaveAttribute('tabindex', '-1')
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('tells people they can unsubscribe', () => {
    render(<EmailSignupForm kind="newsletter" buttonText="Send me the guide" successMessage="Thanks!" />)

    expect(screen.getByText(/unsubscribe/i)).toBeInTheDocument()
  })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const block = (config.components as Record<string, any>).EmailSignup

describe('Email Signup builder block', () => {
  it('is offered in the builder block drawer', () => {
    const offered = Object.values(config.categories ?? {}).flatMap((c) => c.components ?? [])

    expect(offered).toContain('EmailSignup')
  })

  it('can be a newsletter signup or a freebie', () => {
    expect(block.fields.kind.options.map((o: { value: string }) => o.value)).toEqual(['newsletter', 'freebie'])
  })

  it('never takes the freebie link as a block field, so it cannot leak into the page', () => {
    expect(Object.keys(block.fields)).not.toContain('freebieUrl')
  })

  it('has the same background, spacing and per-device controls as every other block', () => {
    expect(Object.keys(block.fields)).toEqual(
      expect.arrayContaining(['background', 'spacing', 'scrollOverlap', 'hideOnMobile', 'hideOnDesktop']),
    )
  })

  it('renders its heading and the form', () => {
    render(block.render({ ...block.defaultProps, heading: 'Get the guide', puck: {} }) as ReactElement)

    expect(screen.getByRole('heading', { name: 'Get the guide' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument()
  })
})
