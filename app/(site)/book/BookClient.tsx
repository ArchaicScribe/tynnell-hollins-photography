'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

export type BookingPackage = {
  id: string
  eyebrow?: string
  title: string
  description?: string
  depositAmount: number
}

type BookingState = {
  name: string
  email: string
  sessionDate: string
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function getMinDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  return d.toISOString().split('T')[0]
}

function getMaxDate(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 24)
  return d.toISOString().split('T')[0]
}

export default function BookClient({ packages }: { packages: BookingPackage[] }) {
  const searchParams = useSearchParams()
  const packageParam = searchParams.get('package')
  const matched = packageParam ? packages.find(p => slugify(p.title) === packageParam) : null

  const [activeId, setActiveId] = useState<string | null>(matched?.id ?? null)
  const [fields, setFields] = useState<BookingState>({ name: '', email: '', sessionDate: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activeId) firstInputRef.current?.focus()
  }, [activeId])

  const selected = packages.find((p) => p.id === activeId)

  function handleSelect(id: string) {
    setActiveId(id)
    setFields({ name: '', email: '', sessionDate: '' })
    setError('')
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: selected.title,
          depositAmount: selected.depositAmount,
          clientName: fields.name,
          clientEmail: fields.email,
          sessionDate: fields.sessionDate,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      window.location.href = data.url
    } catch {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  if (packages.length === 0) {
    return (
      <p className={styles.emptyState}>
        Packages coming soon. <Link href="/contact" className={styles.noteLink}>Reach out directly</Link> to discuss your vision.
      </p>
    )
  }

  return (
    <>
      <div className={styles.grid}>
        {packages.map((pkg) => {
          const isActive = activeId === pkg.id
          return (
            <article
              key={pkg.id}
              className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
            >
              <div
                className={styles.cardTop}
                role={isActive ? undefined : 'button'}
                tabIndex={isActive ? undefined : 0}
                aria-label={isActive ? undefined : `Select ${pkg.title} package`}
                onClick={() => !isActive && handleSelect(pkg.id)}
                onKeyDown={(e) => !isActive && (e.key === 'Enter' || e.key === ' ') && handleSelect(pkg.id)}
              >
                {pkg.eyebrow && <p className={styles.cardEyebrow}>{pkg.eyebrow}</p>}
                <h2 className={styles.cardTitle}>{pkg.title}</h2>
                {pkg.description && <p className={styles.cardDesc}>{pkg.description}</p>}
                <p className={styles.cardDeposit}><span className={styles.depositAmount}>${pkg.depositAmount}</span> deposit</p>
              </div>

              {isActive ? (
                <form className={styles.form} onSubmit={handleCheckout} noValidate>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`name-${pkg.id}`}>Your Name *</label>
                    <input
                      className={styles.input}
                      id={`name-${pkg.id}`}
                      type="text"
                      autoComplete="name"
                      required
                      ref={firstInputRef}
                      value={fields.name}
                      onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`email-${pkg.id}`}>Email Address *</label>
                    <input
                      className={styles.input}
                      id={`email-${pkg.id}`}
                      type="email"
                      autoComplete="email"
                      required
                      value={fields.email}
                      onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))}
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`date-${pkg.id}`}>Desired Session Date *</label>
                    <input
                      className={styles.input}
                      id={`date-${pkg.id}`}
                      type="date"
                      required
                      min={getMinDate()}
                      max={getMaxDate()}
                      value={fields.sessionDate}
                      onChange={(e) => setFields((f) => ({ ...f, sessionDate: e.target.value }))}
                    />
                  </div>
                  {error && <p className={styles.error} role="alert">{error}</p>}
                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className={styles.checkoutBtn}
                      disabled={loading || !fields.name || !fields.email || !fields.sessionDate}
                      aria-busy={loading}
                    >
                      {loading ? 'Redirecting…' : `Pay $${pkg.depositAmount} Deposit`}
                    </button>
                    <p className={styles.trustSignal}>
                      <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden="true">
                        <rect x="1" y="5" width="9" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M3 5V3.5a2.5 2.5 0 0 1 5 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      Secure checkout via Stripe
                    </p>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => setActiveId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className={styles.selectBtn}
                  onClick={() => handleSelect(pkg.id)}
                >
                  Book This Session
                </button>
              )}
            </article>
          )
        })}
      </div>

      <p className={styles.note}>
        Not sure which session is right for you?{' '}
        <Link href="/contact" className={styles.noteLink}>{"Let's talk first."}</Link>
      </p>
    </>
  )
}
