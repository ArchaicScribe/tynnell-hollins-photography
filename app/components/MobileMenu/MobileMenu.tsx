'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navLinks, type NavLink } from '@/app/constants/nav'
import { cleanMenuCards, type MenuCard } from '@/app/lib/menuCards'
import styles from './MobileMenu.module.css'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  links?: NavLink[]
  cards?: MenuCard[]
}

// Rising Roots full-screen menu: every top-level page numbered 01 onwards,
// and, when Site Settings has any, up to two "Work with me" cards beside it.
// The number is decoration (aria-hidden), so a screen reader still hears "Home".
const pageNumber = (i: number) => `${String(i + 1).padStart(2, '0')}.`

export default function MobileMenu({ isOpen, onClose, links = navLinks, cards = [] }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const pathname = usePathname()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  // Cleaned again here, not just on save, so a bad row already in the
  // database can never become a link on the site.
  const workCards = cleanMenuCards(cards)

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable?.length) focusable[0].focus()
    } else {
      previousFocusRef.current?.focus()
      setExpandedItem(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'Tab' && menuRef.current) {
        const focusableEls = Array.from(
          menuRef.current.querySelectorAll<HTMLElement>(
            'a, button, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.hasAttribute('disabled'))
        if (!focusableEls.length) return
        const first = focusableEls[0]
        const last = focusableEls[focusableEls.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Closing on route change lives in Navbar, which owns `isOpen`. An effect
  // here keyed on `onClose` re-fired whenever the parent passed a new
  // callback identity, which closed the menu the moment it opened.

  return (
    <div
      id="mobile-menu"
      ref={menuRef}
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      aria-hidden={!isOpen ? 'true' : undefined}
    >
      <nav aria-label="Mobile navigation">
        <ul className={styles.links}>
          {links.map((link, i) => (
            <li key={link.href} className={styles.item}>
              {link.children ? (
                <>
                  <button
                    className={`${styles.link} ${styles.expandBtn}`}
                    onClick={() => setExpandedItem(expandedItem === link.href ? null : link.href)}
                    aria-expanded={expandedItem === link.href}
                    tabIndex={isOpen ? 0 : -1}
                  >
                    <span className={styles.num} aria-hidden="true">{pageNumber(i)}</span>
                    {link.label}
                    <span
                      className={`${styles.chevron} ${expandedItem === link.href ? styles.chevronOpen : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {expandedItem === link.href && (
                    <ul className={styles.subLinks}>
                      {link.children.map(child => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={styles.subLink}
                            onClick={onClose}
                            tabIndex={isOpen ? 0 : -1}
                            aria-current={pathname === child.href ? 'page' : undefined}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  href={link.href}
                  className={styles.link}
                  onClick={onClose}
                  tabIndex={isOpen ? 0 : -1}
                  aria-current={pathname === link.href ? 'page' : undefined}
                >
                  <span className={styles.num} aria-hidden="true">{pageNumber(i)}</span>
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {workCards.length > 0 && (
        <section className={styles.work} aria-labelledby="mobile-menu-work">
          <h2 id="mobile-menu-work" className={styles.workHeading}>Work with me</h2>
          <ul className={styles.cards}>
            {workCards.map((card, i) => (
              <li key={i}>
                <Link href={card.href} className={styles.card} onClick={onClose} tabIndex={isOpen ? 0 : -1}>
                  {card.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.imageUrl} alt="" className={styles.cardImg} loading="lazy" />
                  )}
                  <span className={styles.cardTitle}>{card.title}</span>
                  <span className={styles.cardLink}>
                    {card.linkLabel} <span aria-hidden="true">&rarr;</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
