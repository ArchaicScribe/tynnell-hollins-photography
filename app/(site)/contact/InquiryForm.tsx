'use client'
import { useState, useEffect, useRef, useId, FormEvent, ReactNode } from 'react'
import styles from './ContactForm.module.css'
import { CONTACT_EMAIL } from '@/app/lib/constants'
import Turnstile from '@/app/components/Turnstile/Turnstile'
import { PORTRAIT_SESSIONS } from '@/app/lib/inquiry'

// Same public Turnstile key and fail-open rule as ContactForm.tsx: unset means
// no widget here and no check on the server.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

type Kind = 'wedding' | 'portrait'
type FormStatus = 'idle' | 'loading' | 'success' | 'error'

interface Fields {
  name: string
  email: string
  partnerName: string
  sessionType: string
  date: string
  location: string
  howHeard: string
  message: string
  // Honeypot, as in ContactForm.tsx: people never see it, bots fill it.
  website: string
}

const EMPTY: Fields = { name: '', email: '', partnerName: '', sessionType: '', date: '', location: '', howHeard: '', message: '', website: '' }

// The shorter Rising Roots forms: no phone or contact preference, the date is
// optional, and the fields depend on the kind. `choice` lets the visitor pick.
export default function InquiryForm({ kind, minDate, maxDate }: { kind: Kind | 'choice'; minDate?: string; maxDate?: string }) {
  const [picked, setPicked] = useState<Kind>('wedding')
  const active: Kind = kind === 'choice' ? picked : kind
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<ReactNode>('')
  const [turnstileToken, setTurnstileToken] = useState('')
  // A Turnstile token works once. After any attempt the widget is remounted
  // (new key) and the spent token dropped, so a retry never sends a stale one.
  const [widgetKey, setWidgetKey] = useState(0)
  const uid = useId()
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  const update = (field: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFields((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setStatus('error')
      setErrorMessage('Please complete the verification above.')
      return
    }

    setStatus('loading')
    setErrorMessage('')
    setTurnstileToken('')
    setWidgetKey((k) => k + 1)

    // Only send the fields this kind uses, so switching tabs never sends a
    // stale partner name with a portrait inquiry.
    const payload: Record<string, string> = {
      kind: active,
      name: fields.name,
      email: fields.email,
      date: fields.date,
      location: fields.location,
      howHeard: fields.howHeard,
      message: fields.message,
      website: fields.website,
      turnstileToken,
    }
    if (active === 'wedding') payload.partnerName = fields.partnerName
    else payload.sessionType = fields.sessionType

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        let message: ReactNode
        if (res.status === 400) {
          message = data.error || 'Please check your details and try again.'
        } else if (res.status === 429) {
          message = 'Too many submissions. Please wait a moment and try again.'
        } else {
          message = (
            <>
              Something went wrong. Please try again or reach out directly at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                {CONTACT_EMAIL}
              </a>
              .
            </>
          )
        }
        setStatus('error')
        setErrorMessage(message)
        return
      }

      setStatus('success')
      setFields(EMPTY)
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.success} role="status" tabIndex={-1} ref={successRef}>
        <p className={styles.successEyebrow}>Message Sent</p>
        <p className={styles.successHeading}>Thank you.</p>
        <p className={styles.successBody}>I received your inquiry and will be in touch within 48 hours.</p>
        <button className={styles.resetBtn} onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    )
  }

  const wedding = active === 'wedding'
  const id = (name: string) => `${uid}-${name}`

  return (
    <div>
      {kind === 'choice' && (
        <div className={styles.tabs} role="tablist">
          {(['wedding', 'portrait'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={picked === k}
              className={`${styles.tab} ${picked === k ? styles.tabActive : ''}`}
              onClick={() => { if (status === 'loading') return; setPicked(k); setStatus('idle'); setErrorMessage('') }}
            >
              {k === 'wedding' ? 'Wedding inquiry' : 'Portrait inquiry'}
            </button>
          ))}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor={id('website')}>Website</label>
          <input id={id('website')} name="website" type="text" tabIndex={-1} autoComplete="off" value={fields.website} onChange={update('website')} />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor={id('name')} className={styles.label}>Name <span className={styles.required} aria-hidden="true">*</span></label>
            <input id={id('name')} type="text" className={styles.input} value={fields.name} onChange={update('name')} required autoComplete="name" placeholder="Your full name" />
          </div>
          <div className={styles.field}>
            <label htmlFor={id('email')} className={styles.label}>Email <span className={styles.required} aria-hidden="true">*</span></label>
            <input id={id('email')} type="email" className={styles.input} value={fields.email} onChange={update('email')} required autoComplete="email" placeholder="you@example.com" />
          </div>
        </div>

        {wedding ? (
          <div className={styles.field}>
            <label htmlFor={id('partnerName')} className={styles.label}>Partner&rsquo;s name <span className={styles.required} aria-hidden="true">*</span></label>
            <input id={id('partnerName')} type="text" className={styles.input} value={fields.partnerName} onChange={update('partnerName')} required />
          </div>
        ) : (
          <div className={styles.field}>
            <label htmlFor={id('sessionType')} className={styles.label}>Which session? <span className={styles.required} aria-hidden="true">*</span></label>
            <select id={id('sessionType')} className={styles.select} value={fields.sessionType} onChange={update('sessionType')} required>
              <option value="" disabled>Select one</option>
              {PORTRAIT_SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor={id('date')} className={styles.label}>{wedding ? 'Wedding date' : 'Preferred date'}</label>
            <input id={id('date')} type="date" className={styles.input} value={fields.date} onChange={update('date')} min={minDate} max={maxDate} />
          </div>
          <div className={styles.field}>
            <label htmlFor={id('location')} className={styles.label}>{wedding ? 'Wedding location' : 'Location'}</label>
            <input id={id('location')} type="text" className={styles.input} value={fields.location} onChange={update('location')} placeholder="City or venue (optional)" />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor={id('howHeard')} className={styles.label}>How did you find me?</label>
          <input id={id('howHeard')} type="text" className={styles.input} value={fields.howHeard} onChange={update('howHeard')} placeholder="Optional" />
        </div>

        <div className={styles.field}>
          <label htmlFor={id('message')} className={styles.label}>Message <span className={styles.required} aria-hidden="true">*</span></label>
          <textarea id={id('message')} className={styles.textarea} value={fields.message} onChange={update('message')} rows={5} required />
        </div>

        {TURNSTILE_SITE_KEY && (
          <div className={styles.field}>
            <Turnstile key={widgetKey} siteKey={TURNSTILE_SITE_KEY} onVerify={setTurnstileToken} />
          </div>
        )}

        {status === 'error' && <p className={styles.errorMsg} role="alert">{errorMessage}</p>}

        <button type="submit" className={styles.submit} disabled={status === 'loading'} aria-busy={status === 'loading' ? 'true' : 'false'}>
          {status === 'loading' ? 'Sending...' : 'Send Inquiry'}
        </button>
      </form>
    </div>
  )
}
