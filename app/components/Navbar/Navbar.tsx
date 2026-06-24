'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navLinks, type NavLink } from '@/app/constants/nav'
import { useScrollLock } from '@/app/hooks/useScrollLock'
import MobileMenu from '@/app/components/MobileMenu/MobileMenu'
import styles from './Navbar.module.css'

const ROW1 = ['Home', 'About', 'Portfolio', 'Services', 'Testimonials']

export default function Navbar({ builderLinks = [] }: { builderLinks?: NavLink[] }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [portfolioOpen, setPortfolioOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'
  const dropdownRef = useRef<HTMLLIElement>(null)

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

  const allLinks = [...navLinks, ...builderLinks]
  const row1Links = allLinks.filter(l => ROW1.includes(l.label))
  const row2Links = allLinks.filter(l => !ROW1.includes(l.label))

  const navClass = [
    styles.navbar,
    !isHome || scrolled ? styles.scrolled : '',
    menuOpen ? styles.menuOpen : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <nav className={navClass} aria-label="Main navigation">
        <Link href="/" className={styles.brand} aria-label="Tynnell Hollins Photography, home">
          <span className={styles.brandLine}>Tynnell</span>
          <span className={styles.brandLine}>Hollins</span>
          <span className={styles.brandLine}>Photography</span>
        </Link>

        <div className={styles.linksWrapper}>
          <ul className={styles.row} aria-label="Site navigation">
            {row1Links.map(link =>
              link.children ? (
                <li
                  key={link.href}
                  className={styles.hasDropdown}
                  ref={dropdownRef}
                  onMouseEnter={() => setPortfolioOpen(true)}
                  onMouseLeave={() => setPortfolioOpen(false)}
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
            )}
          </ul>

          {row2Links.length > 0 && (
            <ul className={`${styles.row} ${styles.row2}`}>
              {row2Links.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={styles.link}
                    aria-current={pathname === link.href ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

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
      </nav>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} links={allLinks} />
    </>
  )
}
