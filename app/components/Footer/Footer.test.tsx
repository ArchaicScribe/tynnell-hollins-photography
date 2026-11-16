// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { SiteConfigData } from '@/app/lib/siteConfig'
import type { FooterData } from '@/app/lib/footerData'

const siteMock = vi.fn()
const footerMock = vi.fn()

vi.mock('payload', () => ({ getPayload: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))
// The real file stays for instagramHandle; only the database read is replaced.
vi.mock('@/app/lib/siteConfig', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/lib/siteConfig')>()),
  getSiteConfig: () => siteMock(),
}))
vi.mock('@/app/lib/footerData', () => ({ getFooterData: () => footerMock() }))

const { default: Footer } = await import('./Footer')
const { splitBrand } = await import('@/app/lib/constants')

const baseSite: SiteConfigData = {
  title: 'Tynnell Hollins Photography',
  tagline: 'Lost in the Moment, Found in Forever',
  email: 'hello@tynnell.test',
  phone: '',
  instagramUrl: 'https://instagram.com/tynnellhollinsphotography',
  facebookUrl: '',
  tiktokUrl: 'https://tiktok.com/@tynnellhollinsphotography',
  pinterestUrl: 'https://pinterest.com/tynnell',
  footerBio: 'Photographing real moments.',
  footerLocation: 'Albuquerque, New Mexico',
  menuCards: [],
}

const baseFooter: FooterData = { stripPhotos: [], builderLinks: [], hasTerms: false, hasPrivacy: false }

async function renderFooter({
  site = {},
  footer = {},
  logoUrl,
}: { site?: Partial<SiteConfigData>; footer?: Partial<FooterData>; logoUrl?: string } = {}) {
  siteMock.mockResolvedValue({ ...baseSite, ...site })
  footerMock.mockResolvedValue({ ...baseFooter, ...footer })
  return render(await Footer({ logoUrl }))
}

const footerNav = () => screen.getByRole('navigation', { name: 'Footer navigation' })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Footer link list', () => {
  it('lists every page in the reference order, then builder pages', async () => {
    await renderFooter({ footer: { builderLinks: [{ label: 'Pricing', href: '/pricing' }] } })

    const labels = within(footerNav()).getAllByRole('link').map((a) => a.textContent)

    expect(labels).toEqual([
      'Home', 'About me', 'Wedding photography', 'Portraits', 'My work',
      'Services', 'Testimonials', 'Blog', 'Contact', 'Pricing',
    ])
  })

})

describe('Footer columns', () => {
  it('has the two script headings', async () => {
    await renderFooter()

    expect(screen.getByRole('heading', { name: 'Where to next?' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Let's connect" })).toBeInTheDocument()
  })

  it('shows the email as a mailto link and the location line from Site Settings', async () => {
    await renderFooter()

    expect(screen.getByRole('link', { name: 'hello@tynnell.test' })).toHaveAttribute('href', 'mailto:hello@tynnell.test')
    expect(screen.getByText('Albuquerque, New Mexico')).toBeInTheDocument()
  })

  it('shows the bio when there is one', async () => {
    await renderFooter()

    expect(screen.getByText('Photographing real moments.')).toBeInTheDocument()
  })

  it('leaves the bio out entirely, with no empty paragraph, when there is none', async () => {
    const { container } = await renderFooter({ site: { footerBio: '' } })

    expect(container.querySelector('p:empty')).toBeNull()
    expect(screen.queryByText('Photographing real moments.')).not.toBeInTheDocument()
  })

  it('has a Work with me button to the contact page', async () => {
    await renderFooter()

    expect(screen.getByRole('link', { name: 'Work with me' })).toHaveAttribute('href', '/contact')
  })

  it('shows the Instagram handle as a link', async () => {
    await renderFooter()

    expect(screen.getByRole('link', { name: '@tynnellhollinsphotography' })).toHaveAttribute(
      'href',
      'https://instagram.com/tynnellhollinsphotography',
    )
  })

  it('shows the logo when one is set in /design', async () => {
    await renderFooter({ logoUrl: 'https://media.example/logo.png' })

    expect(screen.getByRole('img', { name: 'Tynnell Hollins Photography' })).toHaveAttribute('src', 'https://media.example/logo.png')
  })

  it('falls back to the text wordmark when no logo is set', async () => {
    await renderFooter()

    expect(screen.queryByRole('img', { name: 'Tynnell Hollins Photography' })).not.toBeInTheDocument()
    expect(screen.getByText(splitBrand('Tynnell Hollins Photography').mark)).toBeInTheDocument()
  })
})

describe('Footer social icons', () => {
  it('shows an icon for each profile that has a link', async () => {
    await renderFooter()

    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'TikTok' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pinterest' })).toHaveAttribute('href', 'https://pinterest.com/tynnell')
  })

  it('leaves out an icon whose link is blank, rather than showing a dead one', async () => {
    await renderFooter({ site: { pinterestUrl: '', tiktokUrl: '' } })

    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'TikTok' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Pinterest' })).not.toBeInTheDocument()
  })

  it('has no social list at all when every link is blank', async () => {
    await renderFooter({ site: { instagramUrl: '', tiktokUrl: '', pinterestUrl: '' } })

    expect(screen.queryByRole('list', { name: 'Social links' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /instagram|tiktok|pinterest/i })).not.toBeInTheDocument()
  })
})

describe('Footer photo strip', () => {
  it('shows one picture per featured photo', async () => {
    const { container } = await renderFooter({
      footer: { stripPhotos: [1, 2, 3].map((id) => ({ id, src: `https://media.example/${id}.jpg` })) },
    })

    expect(container.querySelectorAll('img').length).toBe(3)
  })

  it('shows nothing at all when there are no featured photos', async () => {
    const { container } = await renderFooter()

    expect(container.querySelectorAll('img').length).toBe(0)
  })
})

describe('Footer bottom row', () => {
  it('shows the copyright with the business name and no designer credit', async () => {
    await renderFooter()

    expect(screen.getByText(`© ${new Date().getFullYear()} Tynnell Hollins Photography`)).toBeInTheDocument()
    expect(screen.queryByText(/designed by|design by|website by|showit/i)).not.toBeInTheDocument()
  })

  it('links Terms and Privacy only when those pages are published', async () => {
    await renderFooter({ footer: { hasTerms: true, hasPrivacy: true } })

    expect(screen.getByRole('link', { name: 'Terms and conditions' })).toHaveAttribute('href', '/terms-and-conditions')
    expect(screen.getByRole('link', { name: 'Privacy statement' })).toHaveAttribute('href', '/privacy-statement')
  })

  it('links only the one that exists', async () => {
    await renderFooter({ footer: { hasTerms: true } })

    expect(screen.getByRole('link', { name: 'Terms and conditions' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Privacy statement' })).not.toBeInTheDocument()
  })

  it('links neither when neither page is published, so nothing points nowhere', async () => {
    await renderFooter()

    expect(screen.queryByRole('link', { name: 'Terms and conditions' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Privacy statement' })).not.toBeInTheDocument()
  })
})
