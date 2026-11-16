// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, within, fireEvent } from '@testing-library/react'
import { readFileSync } from 'fs'
import path from 'path'

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

describe('MobileMenu "Work with me" button', () => {
  it('links to /contact from inside the numbered panel, apart from the cards', () => {
    render(<MobileMenu isOpen onClose={() => {}} links={navLinks} cards={cards} />)

    const button = within(menu()).getByRole('link', { name: 'Work with me' })
    expect(button).toHaveAttribute('href', '/contact')
    expect(within(menu()).getByRole('navigation')).toContainElement(button)
    expect(within(menu()).getByRole('region', { name: 'Work with me' })).not.toContainElement(button)
  })

  it('is there when there are no cards, so the panel is never a dead end', () => {
    render(<MobileMenu isOpen onClose={() => {}} links={navLinks} />)

    expect(within(menu()).getByRole('link', { name: 'Work with me' })).toHaveAttribute('href', '/contact')
  })

  it('closes the menu when clicked', () => {
    const onClose = vi.fn()
    render(<MobileMenu isOpen onClose={onClose} links={navLinks} />)

    fireEvent.click(within(menu()).getByRole('link', { name: 'Work with me' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('stays out of the tab order while the menu is closed', () => {
    render(<MobileMenu isOpen={false} onClose={() => {}} links={navLinks} />)

    expect(within(menu()).getByRole('link', { name: 'Work with me', hidden: true })).toHaveAttribute('tabindex', '-1')
  })
})

// CSS modules do not apply in jsdom, so the look is checked from the stylesheet.
describe('MobileMenu.module.css', () => {
  const css = readFileSync(path.resolve(__dirname, 'MobileMenu.module.css'), 'utf8')
  const bodyOf = (selector: string) => {
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim() === selector) return m[2]
    }
    return ''
  }

  it('wraps a long builder-page title rather than clipping it', () => {
    expect(bodyOf('.link')).toMatch(/overflow-wrap:\s*anywhere|word-break:\s*break-word/)
  })

  it('sets the page list in the serif role through the variable, never a family name', () => {
    expect(bodyOf('.link')).toContain('font-family: var(--font-serif)')
  })

  it('paints the panel with the navbar color, falling back to the button color', () => {
    expect(bodyOf('.panel')).toContain('background: var(--color-nav-bg, var(--color-btn-bg))')
    expect(bodyOf('.panel')).toContain('var(--color-nav-text, var(--color-btn-text))')
  })

  it('lays the cards left and the panel right from 1025px, one column below', () => {
    const wide = css.slice(css.indexOf('@media (min-width: 1025px)'))
    expect(wide).toMatch(/grid-template-areas/)
  })
})
