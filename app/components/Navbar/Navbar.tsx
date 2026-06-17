'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navLinks, type NavLink } from '@/app/constants/nav'
import { useScrollLock } from '@/app/hooks/useScrollLock'
import MobileMenu from '@/app/components/MobileMenu/MobileMenu'
import styles from './Navbar.module.css'

// `builderLinks` are pages flagged "show in menu" in the visual builder
// (TYN-226). They are appended after the built-in site links.
export default function Navbar({ builderLinks = [] }: { builderLinks?: NavLink[] }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

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

  const closeMenu = () => setMenuOpen(false)

  const allLinks = [...navLinks, ...builderLinks]

  const navClass = [
    styles.navbar,
    !isHome || scrolled ? styles.scrolled : '',
    menuOpen ? styles.menuOpen : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <nav className={navClass}>
        <Link href="/" className={styles.brand} aria-label="Tynnell Hollins Photography, home">
          Tynnell Hollins Photography
        </Link>

        {/* Desktop links */}
        <ul className={styles.links}>
          {allLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={styles.link}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Hamburger button — mobile only */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen ? 'true' : 'false'}
          aria-controls="mobile-menu"
        >
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
        </button>
      </nav>

      <MobileMenu isOpen={menuOpen} onClose={closeMenu} links={allLinks} />
    </>
  )
}
