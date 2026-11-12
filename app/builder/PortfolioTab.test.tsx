// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PortfolioTab } from './PortfolioTab'

const fetchMock = vi.fn(async () => new Response(JSON.stringify({ docs: [] }), { status: 200 }))

beforeEach(() => {
  fetchMock.mockClear()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// TYN-311: creating a collection is a full page now, not a dialog in this tab.
describe('Collections tab: creating a collection', () => {
  it('opens the Create New Collection page from the New Collection button', async () => {
    render(<PortfolioTab />)

    expect(await screen.findByRole('link', { name: 'New Collection' })).toHaveAttribute('href', '/gallery-editor/new')
  })

  it('opens the same page from the button beside it', async () => {
    render(<PortfolioTab />)

    expect(await screen.findByRole('link', { name: 'More collection options' })).toHaveAttribute('href', '/gallery-editor/new')
  })

  it('opens the same page from the empty state', async () => {
    render(<PortfolioTab />)

    expect(await screen.findByRole('link', { name: 'Create your first collection' })).toHaveAttribute('href', '/gallery-editor/new')
  })

  it('no longer opens a dialog', async () => {
    const user = userEvent.setup()
    render(<PortfolioTab />)

    await user.click(await screen.findByRole('link', { name: 'New Collection' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
