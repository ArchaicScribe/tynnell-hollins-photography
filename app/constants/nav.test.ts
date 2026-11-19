import { describe, it, expect } from 'vitest'
import { navLinks, navRow, type NavLink } from './nav'

// Rising Roots nav row (step 2 of the match project). The row has its own
// labels, separate from the menu and footer.

const flat = (links: NavLink[]): NavLink[] => links.flatMap(l => [l, ...(l.children ? flat(l.children) : [])])

describe('navRow', () => {
  it('has Home, About me and Wedding photography on the left', () => {
    expect(navRow.left.map(l => l.label)).toEqual(['Home', 'About me', 'Wedding photography'])
    expect(navRow.left.map(l => l.href)).toEqual(['/', '/about', '/wedding-photography'])
  })

  it('has Portraits and My work on the right', () => {
    expect(navRow.right.map(l => l.label)).toEqual(['Portraits', 'My work'])
    expect(navRow.right.map(l => l.href)).toEqual(['/portraits', '/portfolio'])
  })

  it('has an Inquire now call to action to /contact', () => {
    expect(navRow.cta).toEqual({ label: 'Inquire now', href: '/contact' })
  })

  it('only links to pages the menu also knows about', () => {
    const known = new Set(flat(navLinks).map(l => l.href))
    for (const link of [...navRow.left, ...navRow.right, navRow.cta]) {
      expect(known.has(link.href), `${link.label} -> ${link.href}`).toBe(true)
    }
  })
})

describe('navLinks', () => {
  it('lists Portraits and Weddings under Portfolio at their new pages, with no Family page', () => {
    const portfolio = navLinks.find(l => l.label === 'Portfolio')!
    expect(portfolio.children).toEqual([
      { label: 'Portraits', href: '/portraits' },
      { label: 'Weddings', href: '/wedding-photography' },
    ])
  })

  it('calls the about page "About me", not "About"', () => {
    const labels = navLinks.map(l => l.label)
    expect(labels).toContain('About me')
    expect(labels).not.toContain('About')
  })
})
