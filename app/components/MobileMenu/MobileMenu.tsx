'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navLinks, type NavLink } from '@/app/constants/nav'
import styles from './MobileMenu.module.css'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  links?: NavLink[]
}

export default function MobileMenu({ isOpen, onClose, links = navLinks }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const pathname = usePathname()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

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

  useEffect(() => { onClose() }, [pathname, onClose])

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
          {links.map(link => (
            <li key={link.href} className={styles.item}>
              {link.children ? (
                <>
                  <button
                    className={`${styles.link} ${styles.expandBtn}`}
                    onClick={() => setExpandedItem(expandedItem === link.href ? null : link.href)}
                    aria-expanded={expandedItem === link.href}
                    tabIndex={isOpen ? 0 : -1}
                  >
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
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
