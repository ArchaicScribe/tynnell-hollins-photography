'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navLinks, type NavLink } from '@/app/constants/nav'
import { splitBrand } from '@/app/lib/constants'
import { useScrollLock } from '@/app/hooks/useScrollLock'
import MobileMenu from '@/app/components/MobileMenu/MobileMenu'
import styles from './Navbar.module.css'

// Rising Roots splits the primary links either side of a centred brand mark,
// with the contact link promoted out of the row into a script CTA. LEFT_LINKS
// fixes which labels sit on which side; everything else (including builder
// pages flagged show-in-nav) lands on the right, and CTA_LABEL is pulled out
// of the rows entirely.
const LEFT_LINKS = ['Home', 'About', 'Portfolio']
const CTA_LABEL = 'Contact'
const CTA_TEXT = 'Inquire now'

export default function Navbar({
  builderLinks = [],
  logoUrl,
  siteTitle = 'Tynnell Hollins Photography',
}: {
  builderLinks?: NavLink[]
  logoUrl?: string
  siteTitle?: string
}) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [portfolioOpen, setPortfolioOpen] = useState(false)
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLLIElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useScrollLock(menuOpen)

  // A visual gap sits between the trigger and the dropdown menu (see .dropdown
  // top offset), so closing immediately on mouseleave fires while the cursor
  // is still traveling through that gap. Delay the close briefly so the user
  // has time to reach the menu.
  const openDropdown = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setPortfolioOpen(true)
  }

  const scheduleCloseDropdown = () => {
    closeTimer.current = setTimeout(() => setPortfolioOpen(false), 250)
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  useEffect(() => {
    let rafId: number
    const handleScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => setScrolled(window.scrollY > 50))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    if (!portfolioOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPortfolioOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [portfolioOpen])

  useEffect(() => { setPortfolioOpen(false) }, [pathname])

  const brand = splitBrand(siteTitle)
  const allLinks = [...navLinks, ...builderLinks]
  const ctaLink = allLinks.find(l => l.label === CTA_LABEL)
  const rowLinks = allLinks.filter(l => l.label !== CTA_LABEL)
  const leftLinks = rowLinks.filter(l => LEFT_LINKS.includes(l.label))
  const rightLinks = rowLinks.filter(l => !LEFT_LINKS.includes(l.label))

  // Both sides render the same way, dropdown included, so this stays one
  // implementation rather than two that can drift.
  const renderLink = (link: NavLink) =>
    link.children ? (
      <li
        key={link.href}
        className={styles.hasDropdown}
        ref={dropdownRef}
        onMouseEnter={openDropdown}
        onMouseLeave={scheduleCloseDropdown}
      >
        <button
          className={styles.link}
          onClick={() => setPortfolioOpen(p => !p)}
          aria-expanded={portfolioOpen}
          aria-haspopup="true"
        >
          {link.label}
          <span className={`${styles.arrow} ${portfolioOpen ? styles.arrowOpen : ''}`} aria-hidden="true" />
        </button>
        <ul className={`${styles.dropdown} ${portfolioOpen ? styles.dropdownOpen : ''}`} role="menu">
          {link.children.map(child => (
            <li key={child.href} role="none">
              <Link
                href={child.href}
                className={styles.dropdownItem}
                role="menuitem"
                onClick={() => setPortfolioOpen(false)}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </li>
    ) : (
      <li key={link.href}>
        <Link
          href={link.href}
          className={styles.link}
          aria-current={pathname === link.href ? 'page' : undefined}
        >
          {link.label}
        </Link>
      </li>
    )

  const navClass = [
    styles.navbar,
    scrolled ? styles.scrolled : '',
    menuOpen ? styles.menuOpen : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <nav className={navClass} aria-label="Main navigation">
        <ul className={`${styles.row} ${styles.rowLeft}`} aria-label="Site navigation">
          {leftLinks.map(renderLink)}
        </ul>

        <Link href="/" className={styles.brand} aria-label={`${siteTitle}, home`}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={siteTitle} className={styles.brandLogo} />
          ) : (
            <>
              {/* Two lines, not three. The old stacked
                  Tynnell/Hollins/Photography wordmark is the design problem
                  CLAUDE.md flags: it reads as a column of shouting rather than
                  a mark, and it cannot centre. */}
              <span className={styles.brandMark}>{brand.mark}</span>
              {brand.sub && <span className={styles.brandSub}>{brand.sub}</span>}
            </>
          )}
        </Link>

        <div className={styles.rowRight}>
          <ul className={styles.row}>{rightLinks.map(renderLink)}</ul>

          {ctaLink && (
            <Link href={ctaLink.href} className={styles.cta}>
              {CTA_TEXT}
            </Link>
          )}

          <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMenuOpen(p => !p)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
            <span className={styles.bar} aria-hidden="true" />
            <span className={styles.bar} aria-hidden="true" />
            <span className={styles.bar} aria-hidden="true" />
          </button>
        </div>
      </nav>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} links={allLinks} />
    </>
  )
}
