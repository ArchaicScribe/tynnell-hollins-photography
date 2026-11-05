// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { SiteSettingsClient } from './SiteSettingsClient'

const base = {
  title: 'Tynnell Hollins Photography',
  tagline: '',
  email: '',
  phone: '',
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
  pinterestUrl: '',
}
const presets = { defaultCategory: '', defaultStatus: 'draft', defaultTapedStyle: false, defaultFeatured: false, defaultAllowDownload: false }
const templates = {
  shareSubject: '', shareHeading: '', shareBody: '', shareButtonLabel: '',
  reminderSubject: '', reminderHeading: '', reminderBody: '', reminderButtonLabel: '', reminderDaysBefore: '3',
}
const wedding = { title: 'The wedding experience', linkLabel: 'Get the details', href: '/services', imageUrl: '' }

const fetchMock = vi.fn()

function renderSettings(menuCards = [wedding]) {
  render(<SiteSettingsClient initial={{ ...base, menuCards }} initialPresets={presets} initialEmailTemplates={templates} />)
  return within(screen.getByRole('region', { name: 'Menu cards' }))
}

async function savedSiteSettings() {
  fireEvent.click(screen.getByRole('button', { name: /save/i }))
  await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  const call = fetchMock.mock.calls.find(([url]) => url === '/api/site-settings/save')
  return JSON.parse(call![1].body)
}

describe('Site Settings, menu "Work with me" cards', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('shows the cards already saved', () => {
    const cards = renderSettings()

    expect(cards.getByDisplayValue('The wedding experience')).toBeInTheDocument()
    expect(cards.getByDisplayValue('/services')).toBeInTheDocument()
  })

  it('saves an edited card', async () => {
    const cards = renderSettings()

    fireEvent.change(cards.getByDisplayValue('The wedding experience'), { target: { value: 'Weddings' } })

    expect((await savedSiteSettings()).menuCards).toEqual([{ ...wedding, title: 'Weddings' }])
  })

  it('adds a second card, and offers no third', async () => {
    const cards = renderSettings()

    fireEvent.click(cards.getByRole('button', { name: 'Add a card' }))
    const titles = cards.getAllByLabelText('Card title')
    fireEvent.change(titles[1], { target: { value: 'The portrait experience' } })

    expect(cards.queryByRole('button', { name: 'Add a card' })).not.toBeInTheDocument()
    expect((await savedSiteSettings()).menuCards).toHaveLength(2)
  })

  it('warns about a link that would be dropped on save, instead of losing the card silently', () => {
    const cards = renderSettings()

    fireEvent.change(cards.getByDisplayValue('/services'), { target: { value: 'www.example.com' } })

    expect(cards.getByRole('alert')).toHaveTextContent(/page like \/services or an https:\/\/ address/)
  })

  it('warns that a card with a title but no link yet will not be saved', () => {
    const cards = renderSettings()

    fireEvent.change(cards.getByDisplayValue('/services'), { target: { value: '' } })

    expect(cards.getByRole('alert')).toHaveTextContent(/needs a title and a link/)
  })

  it('warns that a card with a link but no title will not be saved', () => {
    const cards = renderSettings()

    fireEvent.change(cards.getByDisplayValue('The wedding experience'), { target: { value: '' } })

    expect(cards.getByRole('alert')).toHaveTextContent(/needs a title and a link/)
  })

  it('does not nag about a brand new, still empty card', () => {
    const cards = renderSettings([])

    fireEvent.click(cards.getByRole('button', { name: 'Add a card' }))

    expect(cards.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('removes a card', async () => {
    const cards = renderSettings()

    fireEvent.click(cards.getByRole('button', { name: 'Remove card 1' }))

    expect((await savedSiteSettings()).menuCards).toEqual([])
  })
})
