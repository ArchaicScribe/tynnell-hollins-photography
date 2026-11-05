// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, within } from '@testing-library/react'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

import MobileMenu from './MobileMenu'
import { navLinks } from '@/app/constants/nav'

const cards = [
  { title: 'The wedding experience', linkLabel: 'Get the details', href: '/services', imageUrl: '' },
  { title: 'The portrait experience', linkLabel: 'See sessions', href: '/portfolio/portraits', imageUrl: '' },
]

const menu = () => document.getElementById('mobile-menu') as HTMLElement

describe('MobileMenu, Rising Roots full-screen menu', () => {
  it('numbers the top-level pages in order, 01 onwards', () => {
    render(<MobileMenu isOpen onClose={() => {}} links={navLinks} />)

    const nav = within(menu()).getByRole('navigation')
    const numbers = within(nav).getAllByText(/^\d\d\.$/).map((el) => el.textContent)

    expect(numbers).toEqual(navLinks.map((_, i) => `${String(i + 1).padStart(2, '0')}.`))
  })

  it('keeps the number out of the link name a screen reader announces', () => {
    render(<MobileMenu isOpen onClose={() => {}} links={navLinks} />)

    expect(within(menu()).getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })

  it('shows each "Work with me" card linking to its page', () => {
    render(<MobileMenu isOpen onClose={() => {}} links={navLinks} cards={cards} />)

    const workWithMe = within(menu()).getByRole('region', { name: 'Work with me' })
    expect(within(workWithMe).getByRole('link', { name: /The wedding experience/ })).toHaveAttribute('href', '/services')
    expect(within(workWithMe).getByRole('link', { name: /The portrait experience/ })).toHaveAttribute('href', '/portfolio/portraits')
    expect(within(workWithMe).getByText('See sessions', { exact: false })).toBeInTheDocument()
  })

  it('leaves out "Work with me" entirely when there are no cards', () => {
    render(<MobileMenu isOpen onClose={() => {}} links={navLinks} />)

    expect(within(menu()).queryByRole('region', { name: 'Work with me' })).not.toBeInTheDocument()
  })

  it('never renders a card whose link is not a site page or https', () => {
    render(<MobileMenu isOpen onClose={() => {}} links={navLinks} cards={[{ ...cards[0], href: 'javascript:alert(1)' }]} />)

    expect(within(menu()).queryByRole('link', { name: /The wedding experience/ })).not.toBeInTheDocument()
  })

  it('keeps the cards out of the tab order while the menu is closed', () => {
    render(<MobileMenu isOpen={false} onClose={() => {}} links={navLinks} cards={cards} />)

    const card = within(menu()).getByRole('link', { name: /The wedding experience/, hidden: true })
    expect(card).toHaveAttribute('tabindex', '-1')
  })
})
