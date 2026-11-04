// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

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

  it('closes on Escape', () => {
    render(<Navbar />)
    fireEvent.click(hamburger())
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(hamburger()).toHaveAttribute('aria-expanded', 'false')
  })
})
