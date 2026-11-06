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
  render(<SiteSettingsClient initial={{ ...base, freebieTitle: '', freebieUrl: '', menuCards }} initialPresets={presets} initialEmailTemplates={templates} />)
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

describe('Site Settings, freebie', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  const freebie = () => {
    renderSettings()
    return within(screen.getByRole('region', { name: 'Freebie' }))
  }

  it('saves the freebie title and link', async () => {
    const section = freebie()

    fireEvent.change(section.getByLabelText('Guide title'), { target: { value: 'The Wedding Planning Guide' } })
    fireEvent.change(section.getByLabelText('Link to the guide'), { target: { value: 'https://media.example/guide.pdf' } })

    const saved = await savedSiteSettings()
    expect(saved.freebieTitle).toBe('The Wedding Planning Guide')
    expect(saved.freebieUrl).toBe('https://media.example/guide.pdf')
  })

  it('does not resend an untouched guide link, so an old tab cannot put back a guide replaced elsewhere', async () => {
    render(<SiteSettingsClient initial={{ ...base, freebieTitle: 'Guide', freebieUrl: 'https://media.example/old.pdf', menuCards: [] }} initialPresets={presets} initialEmailTemplates={templates} />)

    fireEvent.change(screen.getByLabelText('Guide title'), { target: { value: 'The Guide' } })

    const saved = await savedSiteSettings()
    expect(saved.freebieTitle).toBe('The Guide')
    expect(saved).not.toHaveProperty('freebieUrl')
    expect(saved).not.toHaveProperty('freebieUrlBase')
  })

  it('sends a changed guide link along with the link the page started from', async () => {
    render(<SiteSettingsClient initial={{ ...base, freebieTitle: '', freebieUrl: 'https://media.example/old.pdf', menuCards: [] }} initialPresets={presets} initialEmailTemplates={templates} />)

    fireEvent.change(screen.getByLabelText('Link to the guide'), { target: { value: 'https://media.example/new.pdf' } })

    const saved = await savedSiteSettings()
    expect(saved.freebieUrl).toBe('https://media.example/new.pdf')
    expect(saved.freebieUrlBase).toBe('https://media.example/old.pdf')
  })

  it('treats the saved link as the new starting point after a save', async () => {
    render(<SiteSettingsClient initial={{ ...base, freebieTitle: '', freebieUrl: 'https://media.example/old.pdf', menuCards: [] }} initialPresets={presets} initialEmailTemplates={templates} />)
    fireEvent.change(screen.getByLabelText('Link to the guide'), { target: { value: 'https://media.example/new.pdf' } })
    await savedSiteSettings()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument())
    fetchMock.mockClear()

    fireEvent.change(screen.getByLabelText('Link to the guide'), { target: { value: 'https://media.example/newer.pdf' } })
    const saved = await savedSiteSettings()

    expect(saved.freebieUrlBase).toBe('https://media.example/new.pdf')
  })

  it('keeps the saved link as the starting point when the server ignores an unsafe one', async () => {
    render(<SiteSettingsClient initial={{ ...base, freebieTitle: '', freebieUrl: 'https://media.example/old.pdf', menuCards: [] }} initialPresets={presets} initialEmailTemplates={templates} />)
    fireEvent.change(screen.getByLabelText('Link to the guide'), { target: { value: 'www.example.com/guide.pdf' } })
    await savedSiteSettings()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument())
    fetchMock.mockClear()

    fireEvent.change(screen.getByLabelText('Link to the guide'), { target: { value: 'https://media.example/new.pdf' } })
    const saved = await savedSiteSettings()

    expect(saved.freebieUrlBase).toBe('https://media.example/old.pdf')
  })

  it('keeps the starting link when a save fails, so the next try still says where it started', async () => {
    render(<SiteSettingsClient initial={{ ...base, freebieTitle: '', freebieUrl: 'https://media.example/old.pdf', menuCards: [] }} initialPresets={presets} initialEmailTemplates={templates} />)
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) })
    fireEvent.change(screen.getByLabelText('Link to the guide'), { target: { value: 'https://media.example/new.pdf' } })
    await savedSiteSettings()
    await screen.findByText(/failed to save/i)
    fetchMock.mockClear()
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })

    const saved = await savedSiteSettings()

    expect(saved.freebieUrl).toBe('https://media.example/new.pdf')
    expect(saved.freebieUrlBase).toBe('https://media.example/old.pdf')
  })

  it('warns about a guide link that will not be saved', () => {
    const section = freebie()

    fireEvent.change(section.getByLabelText('Link to the guide'), { target: { value: 'www.example.com/guide.pdf' } })

    expect(section.getByRole('alert')).toHaveTextContent(/https:\/\//)
  })
})

describe('Site Settings, uploading the freebie PDF', () => {
  const uploadUrl = 'https://acct.r2.cloudflarestorage.com/bucket/files/abc-guide.pdf?sig=1'
  const publicUrl = 'https://media.tynnellhollinsphotography.com/files/abc-wedding-guide.pdf'

  function storage({ presign = { status: 200, body: { uploadUrl, url: publicUrl } as unknown }, putOk = true } = {}) {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/freebie-pdf/presign') {
        return { ok: presign.status < 400, status: presign.status, json: async () => presign.body }
      }
      if (url === uploadUrl) return { ok: putOk, status: putOk ? 200 : 403, json: async () => ({}) }
      return { ok: true, status: 200, json: async () => ({}) }
    })
  }

  function pdf(name = 'Wedding Guide.pdf', type = 'application/pdf', size?: number) {
    const file = new File(['%PDF-1.7'], name, { type })
    if (size !== undefined) Object.defineProperty(file, 'size', { value: size })
    return file
  }

  const freebie = () => {
    renderSettings()
    return within(screen.getByRole('region', { name: 'Freebie' }))
  }

  const choose = (section: ReturnType<typeof freebie>, file: File) =>
    fireEvent.change(section.getByLabelText('Choose the guide PDF'), { target: { files: [file] } })

  const callsTo = (url: string) => fetchMock.mock.calls.filter(([u]) => u === url)

  beforeEach(() => vi.stubGlobal('fetch', fetchMock))
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('offers an upload button next to the link', () => {
    const section = freebie()

    expect(section.getByRole('button', { name: 'Upload a PDF' })).toBeInTheDocument()
  })

  it('uploads the chosen PDF straight to storage and fills in its link, ready to save', async () => {
    storage()
    const section = freebie()
    const file = pdf()

    choose(section, file)

    await waitFor(() => expect(section.getByLabelText('Link to the guide')).toHaveValue(publicUrl))
    expect(JSON.parse(callsTo('/api/freebie-pdf/presign')[0][1].body)).toEqual({ filename: 'Wedding Guide.pdf', size: file.size })
    const [, put] = callsTo(uploadUrl)[0]
    expect(put.method).toBe('PUT')
    expect(put.body).toBe(file)
    expect(put.headers['Content-Type']).toBe('application/pdf')
    expect(section.getByRole('status')).toHaveTextContent(/Save Changes/)

    expect((await savedSiteSettings()).freebieUrl).toBe(publicUrl)
  })

  it('refuses a file that is not a PDF, without uploading anything', () => {
    storage()
    const section = freebie()

    choose(section, pdf('guide.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))

    expect(section.getByRole('alert')).toHaveTextContent(/PDF/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a PDF over 25 MB, without uploading anything', () => {
    storage()
    const section = freebie()

    choose(section, pdf('guide.pdf', 'application/pdf', 25 * 1024 * 1024 + 1))

    expect(section.getByRole('alert')).toHaveTextContent(/25 MB/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the reason the server gives, and leaves the link alone', async () => {
    storage({ presign: { status: 403, body: { error: 'Forbidden' } } })
    const section = freebie()

    choose(section, pdf())

    expect(await section.findByRole('alert')).toHaveTextContent('Forbidden')
    expect(callsTo(uploadUrl)).toHaveLength(0)
    expect(section.getByLabelText('Link to the guide')).toHaveValue('')
  })

  it('says the upload failed when storage turns the file away, and leaves the link alone', async () => {
    storage({ putOk: false })
    const section = freebie()

    choose(section, pdf())

    expect(await section.findByRole('alert')).toHaveTextContent(/upload failed/i)
    expect(section.getByLabelText('Link to the guide')).toHaveValue('')
  })

  it('cannot start a second upload while one is still going', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const section = freebie()

    choose(section, pdf())

    await waitFor(() => expect(section.getByRole('button', { name: /uploading/i })).toBeDisabled())
  })
})
