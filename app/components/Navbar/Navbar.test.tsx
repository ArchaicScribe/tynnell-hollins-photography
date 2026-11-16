// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

let mockPathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

import Navbar from './Navbar'

const hamburger = () => screen.getByRole('button', { name: /navigation menu/i })
const mobileMenu = () => document.getElementById('mobile-menu') as HTMLElement

describe('Navbar mobile menu', () => {
  beforeEach(() => {
    mockPathname = '/'
  })

  it('stays open after the hamburger is clicked', () => {
    // Regression: MobileMenu used to call onClose from an effect keyed on the
    // onClose prop, and Navbar passed a fresh inline callback each render, so
    // opening the menu re-rendered, re-fired the effect, and closed it again.
    render(<Navbar />)
    fireEvent.click(hamburger())

    expect(hamburger()).toHaveAttribute('aria-expanded', 'true')
    expect(mobileMenu()).not.toHaveAttribute('aria-hidden')
  })

  it('closes when the route changes', () => {
    const { rerender } = render(<Navbar />)
    fireEvent.click(hamburger())
    expect(hamburger()).toHaveAttribute('aria-expanded', 'true')

    mockPathname = '/about'
    rerender(<Navbar />)

    expect(hamburger()).toHaveAttribute('aria-expanded', 'false')
    expect(mobileMenu()).toHaveAttribute('aria-hidden', 'true')
  })

  it('puts the "Work with me" cards from Site Settings in the menu', () => {
    render(<Navbar menuCards={[{ title: 'The wedding experience', linkLabel: 'Get the details', href: '/services', imageUrl: '' }]} />)
    fireEvent.click(hamburger())

    expect(mobileMenu()).toContainElement(screen.getByRole('link', { name: /The wedding experience/ }))
  })

  it('closes on Escape', () => {
    render(<Navbar />)
    fireEvent.click(hamburger())
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(hamburger()).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('Navbar row', () => {
  beforeEach(() => {
    mockPathname = '/'
  })

  const mainNav = () => screen.getByRole('navigation', { name: /main navigation/i })
  const rowLabels = ['Home', 'About me', 'Wedding photography', 'Portraits', 'My work']

  it('renders the five row links in order with their hrefs', () => {
    render(<Navbar />)
    const row = within(mainNav())
      .getAllByRole('link')
      .filter(a => rowLabels.includes(a.textContent ?? ''))
    expect(row.map(a => a.textContent)).toEqual(rowLabels)
    expect(row.map(a => a.getAttribute('href'))).toEqual(['/', '/about', '/portfolio/weddings', '/portfolio/portraits', '/portfolio'])
  })

  it('renders "Inquire now" linking to /contact', () => {
    render(<Navbar />)
    expect(within(mainNav()).getByRole('link', { name: 'Inquire now' })).toHaveAttribute('href', '/contact')
  })

  it('has no Portfolio dropdown button', () => {
    const { container } = render(<Navbar />)
    expect(container.querySelector('[aria-haspopup]')).toBeNull()
    expect(within(mainNav()).queryByRole('button', { name: /portfolio/i })).toBeNull()
  })

  it('keeps builder-page links out of the row but passes them to the menu', () => {
    render(<Navbar builderLinks={[{ label: 'Pricing', href: '/pricing' }]} />)
    expect(within(mainNav()).queryByRole('link', { name: 'Pricing' })).toBeNull()

    fireEvent.click(hamburger())
    expect(within(mobileMenu()).getByRole('link', { name: /Pricing/ })).toHaveAttribute('href', '/pricing')
  })

  it('shows the logo image when logoUrl is set and the text wordmark when not', () => {
    const { unmount } = render(<Navbar logoUrl="/logo.png" siteTitle="Tynnell Hollins Photography" />)
    expect(within(mainNav()).getByRole('img', { name: 'Tynnell Hollins Photography' })).toHaveAttribute('src', '/logo.png')
    unmount()

    render(<Navbar siteTitle="Tynnell Hollins Photography" />)
    expect(within(mainNav()).queryByRole('img')).toBeNull()
    expect(within(mainNav()).getByRole('link', { name: 'Tynnell Hollins Photography, home' })).toHaveTextContent(/Tynnell/)
  })

  it('shows "close menu" next to the button only while the menu is open', () => {
    render(<Navbar />)
    expect(screen.queryByText('close menu')).toBeNull()

    fireEvent.click(hamburger())
    expect(screen.getByText('close menu')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('close menu')).toBeNull()
  })
})
