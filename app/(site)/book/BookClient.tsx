'use client'

import { useState } from 'react'
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
}

export default function BookClient({ packages }: { packages: BookingPackage[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [fields, setFields] = useState<BookingState>({ name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selected = packages.find((p) => p.id === activeId)

  function handleSelect(id: string) {
    setActiveId(id)
    setFields({ name: '', email: '' })
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
        Packages coming soon. <a href="/contact" className={styles.noteLink}>Reach out directly</a> to discuss your vision.
      </p>
    )
  }

  return (
    <>
      <div className={styles.grid}>
        {packages.map((pkg) => (
          <article
            key={pkg.id}
            className={`${styles.card} ${activeId === pkg.id ? styles.cardActive : ''}`}
          >
            <div className={styles.cardTop}>
              {pkg.eyebrow && <p className={styles.cardEyebrow}>{pkg.eyebrow}</p>}
              <h2 className={styles.cardTitle}>{pkg.title}</h2>
              {pkg.description && <p className={styles.cardDesc}>{pkg.description}</p>}
              <p className={styles.cardDeposit}>${pkg.depositAmount} deposit</p>
            </div>

            {activeId === pkg.id ? (
              <form className={styles.form} onSubmit={handleCheckout} noValidate>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`name-${pkg.id}`}>Your Name *</label>
                  <input
                    className={styles.input}
                    id={`name-${pkg.id}`}
                    type="text"
                    autoComplete="name"
                    required
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
                {error && <p className={styles.error} role="alert">{error}</p>}
                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.checkoutBtn}
                    disabled={loading || !fields.name || !fields.email}
                  >
                    {loading ? 'Redirecting…' : `Pay $${pkg.depositAmount} Deposit`}
                  </button>
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
        ))}
      </div>

      <p className={styles.note}>
        Not sure which session is right for you?{' '}
        <a href="/contact" className={styles.noteLink}>{"Let's talk first."}</a>
      </p>
    </>
  )
}
