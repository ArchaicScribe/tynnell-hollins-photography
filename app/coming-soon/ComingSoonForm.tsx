'use client'

import { useState, useRef } from 'react'
import styles from './page.module.css'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export default function ComingSoonForm() {
  const [state, setState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('submitting')
    setErrorMsg('')

    const fd = new FormData(e.currentTarget)
    const body = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      phone: fd.get('phone') as string,
      eventDate: fd.get('eventDate') as string,
      message: fd.get('message') as string,
    }

    try {
      const res = await fetch('/api/coming-soon-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        setState('error')
      } else {
        setState('success')
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className={styles.successState}>
        <p className={styles.successEyebrow}>Message received</p>
        <p className={styles.successText}>
          Thank you for reaching out. I&rsquo;ll be in touch soon.
        </p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="cs-name" className={styles.label}>Name</label>
          <input
            ref={nameRef}
            id="cs-name"
            name="name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            className={styles.input}
            disabled={state === 'submitting'}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="cs-email" className={styles.label}>Email</label>
          <input
            id="cs-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className={styles.input}
            disabled={state === 'submitting'}
          />
        </div>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="cs-phone" className={styles.label}>
            Phone <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="cs-phone"
            name="phone"
            type="tel"
            maxLength={30}
            autoComplete="tel"
            className={styles.input}
            disabled={state === 'submitting'}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="cs-event-date" className={styles.label}>
            Event Date <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="cs-event-date"
            name="eventDate"
            type="date"
            className={`${styles.input} ${styles.dateInput}`}
            disabled={state === 'submitting'}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="cs-message" className={styles.label}>Message</label>
        <textarea
          id="cs-message"
          name="message"
          required
          maxLength={1000}
          rows={4}
          className={styles.textarea}
          disabled={state === 'submitting'}
        />
      </div>

      {state === 'error' && (
        <p className={styles.errorMsg} role="alert">{errorMsg}</p>
      )}

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={state === 'submitting'}
        aria-busy={state === 'submitting'}
      >
        {state === 'submitting' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
