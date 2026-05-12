'use client'
import { useState, FormEvent } from 'react'
import styles from './ContactForm.module.css'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

interface FormFields {
  name: string
  email: string
  phone: string
  contactPreference: string
  sessionType: string
  date: string
  location: string
  message: string
  howHeard: string
}

const SESSION_TYPES = [
  'Wedding',
  'Engagement',
  'Portrait',
  'Family',
  'Maternity',
  'Event',
  'Other',
]

const HOW_HEARD = [
  'Instagram',
  'Google',
  'Referral',
  'Previous Client',
  'Other',
]

const EMPTY_FORM: FormFields = {
  name: '',
  email: '',
  phone: '',
  contactPreference: '',
  sessionType: '',
  date: '',
  location: '',
  message: '',
  howHeard: '',
}

export default function ContactForm() {
  const [fields, setFields] = useState<FormFields>(EMPTY_FORM)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const update = (field: keyof FormFields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setFields((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })

      const data = await res.json()

      if (!res.ok) {
        // 400 errors carry user-facing validation messages — show them directly.
        // All other errors (403, 429, 500, etc.) use a safe generic fallback.
        const userMessage = res.status === 400
          ? (data.error || 'Please check your details and try again.')
          : res.status === 429
            ? 'Too many submissions. Please wait a moment and try again.'
            : 'Something went wrong. Please try again or reach out directly at hello@tynnellhollinsphotography.com.'
        throw new Error(userMessage)
      }

      setStatus('success')
      setFields(EMPTY_FORM)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.success} role="status">
        <p className={styles.successEyebrow}>Message Sent</p>
        <p className={styles.successHeading}>Thank you.</p>
        <p className={styles.successBody}>
          I received your inquiry and will be in touch within 48 hours.
        </p>
        <button className={styles.resetBtn} onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>

      {/* Row: Name + Email */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>
            Name <span className={styles.required} aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            type="text"
            className={styles.input}
            value={fields.name}
            onChange={update('name')}
            required
            autoComplete="name"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email <span className={styles.required} aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={fields.email}
            onChange={update('email')}
            required
            autoComplete="email"
          />
        </div>
      </div>

      {/* Row: Phone + Preferred Contact */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="phone" className={styles.label}>
            Phone <span className={styles.required} aria-hidden="true">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            className={styles.input}
            value={fields.phone}
            onChange={update('phone')}
            required
            autoComplete="tel"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="contactPreference" className={styles.label}>
            Preferred Contact <span className={styles.required} aria-hidden="true">*</span>
          </label>
          <select
            id="contactPreference"
            className={styles.select}
            value={fields.contactPreference}
            onChange={update('contactPreference')}
            required
          >
            <option value="" disabled>Select one</option>
            <option value="Text">Text</option>
            <option value="Call">Call</option>
            <option value="Email">Email</option>
          </select>
        </div>
      </div>

      {/* Row: Session Type + Date */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="sessionType" className={styles.label}>
            Type of Session <span className={styles.required} aria-hidden="true">*</span>
          </label>
          <select
            id="sessionType"
            className={styles.select}
            value={fields.sessionType}
            onChange={update('sessionType')}
            required
          >
            <option value="" disabled>Select one</option>
            {SESSION_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="date" className={styles.label}>
            Desired Date <span className={styles.required} aria-hidden="true">*</span>
          </label>
          <input
            id="date"
            type="date"
            className={styles.input}
            value={fields.date}
            onChange={update('date')}
            required
          />
        </div>
      </div>

      {/* Location */}
      <div className={styles.field}>
        <label htmlFor="location" className={styles.label}>Location / Venue</label>
        <input
          id="location"
          type="text"
          className={styles.input}
          value={fields.location}
          onChange={update('location')}
          placeholder="Optional"
        />
      </div>

      {/* Message */}
      <div className={styles.field}>
        <label htmlFor="message" className={styles.label}>
          Message <span className={styles.required} aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          className={styles.textarea}
          value={fields.message}
          onChange={update('message')}
          rows={5}
          required
        />
      </div>

      {/* How did you hear */}
      <div className={styles.field}>
        <label htmlFor="howHeard" className={styles.label}>How did you hear about me?</label>
        <select
          id="howHeard"
          className={styles.select}
          value={fields.howHeard}
          onChange={update('howHeard')}
        >
          <option value="">Select one (optional)</option>
          {HOW_HEARD.map((source) => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
      </div>

      {status === 'error' && (
        <p className={styles.errorMsg} role="alert">{errorMessage}</p>
      )}

      <button
        type="submit"
        className={styles.submit}
        disabled={status === 'loading'}
        aria-busy={status === 'loading' ? 'true' : 'false'}
      >
        {status === 'loading' ? 'Sending…' : 'Send Inquiry'}
      </button>

    </form>
  )
}
