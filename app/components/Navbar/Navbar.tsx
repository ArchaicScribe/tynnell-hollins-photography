'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { menuLinks, navRow, type NavLink } from '@/app/constants/nav'
import type { MenuCard } from '@/app/lib/menuCards'
import { splitBrand } from '@/app/lib/constants'
import { useScrollLock } from '@/app/hooks/useScrollLock'
import MobileMenu from '@/app/components/MobileMenu/MobileMenu'
import styles from './Navbar.module.css'

// How far from the top of the window the opening photo's bottom edge must be before the bar
// turns solid: about the height of the bar (roughly 84px transparent, 71px solid). A fixed
// number, so it cannot depend on the bar's state.
const SOLID_AT_PX = 72

// Rising Roots: five plain links split either side of a centred mark, a script
// "Inquire now", and a menu button that is visible at every width. The row comes
// from `navRow`; the menu gets every page (menuLinks plus builder pages flagged
// show-in-menu), so builder pages never crowd the row.
export default function Navbar({
  builderLinks = [],
  logoUrl,
  siteTitle = 'Tynnell Hollins Photography',
  menuCards = [],
}: {
  builderLinks?: NavLink[]
  logoUrl?: string
  siteTitle?: string
  menuCards?: MenuCard[]
}) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useScrollLock(menuOpen)

  // The bar is transparent over the page's opening photo and turns solid once that photo has
  // scrolled up to the bar, close to where the reference flips. The threshold is a fixed
  // number, not the bar's live height: the bar is taller while transparent than once solid, so
  // comparing with its own height made it flip back and forth with the photo's edge between
  // the two. With no opening photo there is nothing to wait for, so the old 50px rule applies.
  // Re-run on every route change: the new page has its own opening photo, or none.
  useEffect(() => {
    let rafId: number
    const isPastOpening = () => {
      const hero = document.querySelector('[data-nav-hero]')
      if (!hero) return window.scrollY > 50
      return hero.getBoundingClientRect().bottom <= SOLID_AT_PX
    }
    const update = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => setScrolled(isPastOpening()))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      cancelAnimationFrame(rafId)
    }
  }, [pathname])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const brand = splitBrand(siteTitle)
  const allMenuLinks = [...menuLinks, ...builderLinks]

  const renderLink = (link: NavLink) => (
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
          {navRow.left.map(renderLink)}
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
          <ul className={styles.row}>{navRow.right.map(renderLink)}</ul>

          <Link href={navRow.cta.href} className={styles.cta}>
            {navRow.cta.label}
          </Link>

          {menuOpen && (
            <span className={styles.menuLabel} aria-hidden="true">
              close menu
            </span>
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
          </button>
        </div>
      </nav>

      <MobileMenu isOpen={menuOpen} onClose={closeMenu} links={allMenuLinks} cards={menuCards} />
    </>
  )
}
