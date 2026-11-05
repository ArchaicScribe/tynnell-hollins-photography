'use client'

import { useId, useState, type FormEvent } from 'react'
import Turnstile from '@/app/components/Turnstile/Turnstile'
import styles from './EmailSignup.module.css'

// Public site key, safe to expose. Unset until a Turnstile widget exists for
// the domain (TYN-357); the server lets signups through until then too.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

const GENERAL_ERROR = 'Something went wrong. Please try again.'
// Shown for a Freebie signup when no guide email went out (the guide is not
// set up yet, or the email failed). Never promises something in the inbox.
const ON_THE_LIST = "Thank you, you're on the list."

type Status = 'idle' | 'sending' | 'done'

// Rising Roots gap 5: the freebie / newsletter signup. Posts to
// /api/subscribe, which adds the visitor to Resend and, for a Freebie, emails
// the guide link set in Site Settings.
export default function EmailSignupForm({
  kind,
  buttonText,
  successMessage,
}: {
  kind: 'newsletter' | 'freebie'
  buttonText: string
  successMessage: string
}) {
  const id = useId()
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [doneMessage, setDoneMessage] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError('Please complete the verification below.')
      return
    }
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, kind, website, turnstileToken }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; freebieSent?: boolean }
      if (!res.ok) {
        setError(data.error || GENERAL_ERROR)
        setStatus('idle')
        return
      }
      setDoneMessage(kind === 'freebie' && !data.freebieSent ? ON_THE_LIST : successMessage)
      setStatus('done')
    } catch {
      setError(GENERAL_ERROR)
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <p className={styles.success} role="status">
        {doneMessage}
      </p>
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {/* Honeypot: off-screen (not display:none, which some bots skip), out
          of the tab order and hidden from screen readers. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor={`${id}-name`} className={styles.label}>First name</label>
          <input id={`${id}-name`} type="text" autoComplete="given-name" maxLength={100} value={firstName} onChange={(e) => setFirstName(e.target.value)} className={styles.input} />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-email`} className={styles.label}>Email</label>
          <input id={`${id}-email`} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} />
        </div>
      </div>

      {TURNSTILE_SITE_KEY && <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={setTurnstileToken} />}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button type="submit" className={styles.button} disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : buttonText}
      </button>
      <p className={styles.note}>No spam. Unsubscribe anytime with one click.</p>
    </form>
  )
}
