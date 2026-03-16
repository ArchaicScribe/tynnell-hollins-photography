'use client'

import { useState } from 'react'
import styles from './page.module.css'

const PACKAGES = [
  {
    id: 'wedding',
    eyebrow: 'Weddings',
    title: 'Wedding Day',
    description: 'Full-day coverage of your ceremony, portraits, and reception. Every moment, beautifully told.',
    deposit: 500,
  },
  {
    id: 'engagement',
    eyebrow: 'Engagements',
    title: 'Engagement Session',
    description: 'A relaxed session for couples to celebrate their story before the big day.',
    deposit: 150,
  },
  {
    id: 'portrait',
    eyebrow: 'Portraits',
    title: 'Portrait Session',
    description: 'Individual portraits that capture who you are — confident, honest, and full of life.',
    deposit: 100,
  },
  {
    id: 'family',
    eyebrow: 'Families',
    title: 'Family Session',
    description: 'Candid, warm images of the people who matter most. Perfect for any season.',
    deposit: 150,
  },
  {
    id: 'maternity',
    eyebrow: 'Maternity',
    title: 'Maternity Session',
    description: 'A gentle, beautiful celebration of this season before your little one arrives.',
    deposit: 100,
  },
  {
    id: 'brands',
    eyebrow: 'Brands',
    title: 'Brand & Commercial',
    description: 'Polished imagery for entrepreneurs, creatives, and businesses ready to show up visually.',
    deposit: 200,
  },
]

type BookingState = {
  name: string
  email: string
}

export default function BookPage() {
  const [activePackage, setActivePackage] = useState<string | null>(null)
  const [fields, setFields] = useState<BookingState>({ name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selected = PACKAGES.find((p) => p.id === activePackage)

  function handleSelect(id: string) {
    setActivePackage(id)
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
          depositAmount: selected.deposit,
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

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Reserve Your Date</p>
        <h1 className={styles.heading}>Book a Session</h1>
        <p className={styles.subheading}>
          A deposit secures your date. The remaining balance is due before your session.
          Have questions first?{' '}
          <a href="/contact" className={styles.subheadingLink}>Send an inquiry.</a>
        </p>
      </div>

      <div className={styles.grid}>
        {PACKAGES.map((pkg) => (
          <article
            key={pkg.id}
            className={`${styles.card} ${activePackage === pkg.id ? styles.cardActive : ''}`}
          >
            <div className={styles.cardTop}>
              <p className={styles.cardEyebrow}>{pkg.eyebrow}</p>
              <h2 className={styles.cardTitle}>{pkg.title}</h2>
              <p className={styles.cardDesc}>{pkg.description}</p>
              <p className={styles.cardDeposit}>${pkg.deposit} deposit</p>
            </div>

            {activePackage === pkg.id ? (
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
                    {loading ? 'Redirecting…' : `Pay $${pkg.deposit} Deposit`}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setActivePackage(null)}
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
        <a href="/contact" className={styles.noteLink}>Let&apos;s talk first.</a>
      </p>
    </main>
  )
}
