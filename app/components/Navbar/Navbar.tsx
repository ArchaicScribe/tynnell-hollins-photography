'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navLinks, navRow, type NavLink } from '@/app/constants/nav'
import type { MenuCard } from '@/app/lib/menuCards'
import { splitBrand } from '@/app/lib/constants'
import { useScrollLock } from '@/app/hooks/useScrollLock'
import MobileMenu from '@/app/components/MobileMenu/MobileMenu'
import styles from './Navbar.module.css'

// Rising Roots: five plain links split either side of a centred mark, a script
// "Inquire now", and a menu button that is visible at every width. The row comes
// from `navRow`; the menu gets every page (navLinks plus builder pages flagged
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
    setMenuOpen(false)
  }, [pathname])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const brand = splitBrand(siteTitle)
  const menuLinks = [...navLinks, ...builderLinks]

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
            <span className={styles.bar} aria-hidden="true" />
          </button>
        </div>
      </nav>

      <MobileMenu isOpen={menuOpen} onClose={closeMenu} links={menuLinks} cards={menuCards} />
    </>
  )
}
