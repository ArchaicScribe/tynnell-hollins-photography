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
// The menu's open / close button lives in the Navbar, outside the dialog, and sits above the
// panel on screen. Tab used to cycle only through the panel's own links and never reached
// it, so a keyboard user could close the menu with Escape only.
describe('MobileMenu keyboard focus', () => {
  const tab = (shiftKey = false) => fireEvent.keyDown(document, { key: 'Tab', shiftKey })

  function renderWithToggle(extra?: Partial<Parameters<typeof MobileMenu>[0]>) {
    render(
      <>
        <button type="button" aria-controls="mobile-menu" aria-expanded="true">Close menu</button>
        <MobileMenu isOpen onClose={() => {}} links={navLinks} {...extra} />
      </>,
    )
    const toggle = document.querySelector('[aria-controls="mobile-menu"]') as HTMLElement
    const inside = Array.from(menu().querySelectorAll<HTMLElement>('a, button'))
    return { toggle, first: inside[0], last: inside[inside.length - 1] }
  }

  it('moves on from the last link to the close button', () => {
    const { toggle, last } = renderWithToggle()
    last.focus()

    tab()

    expect(toggle).toHaveFocus()
  })

  it('moves back from the first link to the close button with Shift+Tab', () => {
    const { toggle, first } = renderWithToggle()
    first.focus()

    tab(true)

    expect(toggle).toHaveFocus()
  })

  it('goes from the close button into the menu, wrapping at both ends', () => {
    const { toggle, first, last } = renderWithToggle()
    toggle.focus()

    tab()
    expect(first).toHaveFocus()

    toggle.focus()
    tab(true)
    expect(last).toHaveFocus()
  })

  it('still wraps inside the menu when the page has no close button', () => {
    render(<MobileMenu isOpen onClose={() => {}} links={navLinks} />)
    const inside = Array.from(menu().querySelectorAll<HTMLElement>('a, button'))
    inside[inside.length - 1].focus()

    tab()

    expect(inside[0]).toHaveFocus()
  })
})

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

  it('paints the panel with the navbar color, falling back to the button color', () => {
    expect(bodyOf('.panel')).toContain('background: var(--color-nav-bg, var(--color-btn-bg))')
    expect(bodyOf('.panel')).toContain('var(--color-nav-text, var(--color-btn-text))')
  })

  it('lets the desktop grid shrink to the screen so a tall panel scrolls instead of being clipped', () => {
    const wide = css.slice(css.indexOf('@media (min-width: 1025px)'))
    expect(wide).toMatch(/grid-template-rows:\s*minmax\(0,\s*1fr\)/)
  })

  it('keeps the top of a tall panel reachable: centring is the safe kind', () => {
    expect(bodyOf('.panel')).toContain('justify-content: safe center')
  })
})

// Measured on risingroots.showit.site, 2026-11-24: the open menu is three columns on a wide
// screen. Each photo card is a full-height column (a third of the width, italic title and a
// small-caps link at its bottom), and the olive panel holds the numbered links and a pill
// "Work with me" button in the rest.
describe('MobileMenu photo columns', () => {
  it('marks how many photo columns there are, so the grid can give each one a column', () => {
    const none = render(<MobileMenu isOpen onClose={() => {}} links={navLinks} />)
    expect(menu().className).not.toMatch(/cards[12]/)
    none.unmount()

    const one = render(<MobileMenu isOpen onClose={() => {}} links={navLinks} cards={[cards[0]]} />)
    expect(menu().className).toMatch(/cards1/)
    one.unmount()

    render(<MobileMenu isOpen onClose={() => {}} links={navLinks} cards={cards} />)
    expect(menu().className).toMatch(/cards2/)
  })
})

describe('MobileMenu with no photo cards', () => {
  it('marks itself so the link block can be centred instead of hugging the left edge of an empty screen', () => {
    const none = render(<MobileMenu isOpen onClose={() => {}} links={navLinks} />)
    expect(menu().className).toMatch(/noCards/)
    none.unmount()

    render(<MobileMenu isOpen onClose={() => {}} links={navLinks} cards={cards} />)
    expect(menu().className).not.toMatch(/noCards/)
  })
})

describe('MobileMenu.module.css, reference layout', () => {
  const css = readFileSync(path.resolve(__dirname, 'MobileMenu.module.css'), 'utf8')
  const norm = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim()
  const bodyOf = (selector: string) => {
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) if (norm(m[1]) === selector) return m[2]
    return ''
  }
  const wide = css.slice(css.indexOf('@media (min-width: 1025px)'))
  const wideBody = (selector: string) => {
    for (const m of wide.matchAll(/([^{}]+)\{([^{}]*)\}/g)) if (norm(m[1]) === selector) return m[2]
    return ''
  }

  it('gives each photo card its own column, with the panel taking the rest', () => {
    expect(wideBody('.overlay.cards1')).toMatch(/grid-template-columns:\s*3fr 7fr/)
    expect(wideBody('.overlay.cards2')).toMatch(/grid-template-columns:\s*3fr 3fr 4fr/)
  })

  it('runs each card photo full-bleed behind its title and link', () => {
    expect(bodyOf('.card')).toMatch(/position:\s*relative/)
    expect(bodyOf('.cardImg')).toMatch(/position:\s*absolute/)
    expect(bodyOf('.cardImg')).toMatch(/inset:\s*0/)
    expect(bodyOf('.cardImg')).toMatch(/object-fit:\s*cover/)
  })

  it('sets the card title in the italic accent face', () => {
    expect(bodyOf('.cardTitle')).toMatch(/font-style:\s*italic/)
    expect(bodyOf('.cardTitle')).toMatch(/var\(--font-accent/)
  })

  it('rounds the "Work with me" button into a bone pill like the reference', () => {
    const body = bodyOf('.workBtn')
    expect(body).toMatch(/border-radius:\s*999px/)
    expect(body).toMatch(/background:\s*var\(--color-bg\)/)
  })

  it('centres the link block when there are no photo cards', () => {
    expect(bodyOf('.overlay.noCards .panel')).toMatch(/align-items:\s*center/)
  })

  // The card clips anything outside it, and its photo (an absolutely positioned child) paints
  // over the card's own outline, so the ring is drawn on the ::after layer, which comes after
  // the photo in paint order. Two tones so it shows on bright photos as well as dark ones.
  it('draws the card focus ring on the layer above the photo, inside the card', () => {
    const ring = bodyOf('.card:focus-visible::after')
    expect(ring).toMatch(/box-shadow:\s*inset/)
    expect(ring).toMatch(/inset 0 0 0 2px #ECE9E0/)
  })

  it('sets the page links at the reference weight, not light', () => {
    expect(bodyOf('.link')).toMatch(/font-weight:\s*400/)
  })

  it('keeps the "Work with me" heading for screen readers on a wide screen without showing it', () => {
    expect(wideBody('.workHeading')).toMatch(/clip:\s*rect\(0, 0, 0, 0\)|clip-path:\s*inset\(50%\)/)
  })
})
