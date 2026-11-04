'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const ui = "var(--font-heading, Archivo, sans-serif)"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Range {
  id?: string
  internalLabel: string
  startDate: string
  endDate: string
  applyReturnBuffer: boolean
  returnBufferDays: number
  customerMessage: string
  notificationSent?: boolean
}

type RangeStatus = 'active' | 'upcoming' | 'past'

interface FormData {
  internalLabel: string
  startDate: string
  endDate: string
  applyReturnBuffer: boolean
  returnBufferDays: number
  customerMessage: string
}

// ---------------------------------------------------------------------------
// Switcher sections
// ---------------------------------------------------------------------------

const SWITCHER = [
  { label: 'Portfolio', desc: 'Manage galleries and photos', color: '#0d9488', href: '/gallery-editor', icon: '📷' },
  { label: 'Website', desc: 'Build your portfolio website', color: '#2563eb', href: '/builder', icon: '🌐' },
  { label: 'Blog', desc: 'Write and publish posts', color: '#7c3aed', href: '/blog-editor', icon: '✍️' },
  { label: 'Bookings', desc: 'Services and availability', color: '#b45309', href: '/availability', icon: '📅' },
  { label: 'Testimonials', desc: 'Client reviews', color: '#059669', href: '/admin/collections/testimonials', icon: '💬' },
  { label: 'Studio', desc: 'Settings and users', color: '#475569', href: '/site-settings', icon: '⚙️' },
]

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function isoToInput(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function inputToIso(date: string): string {
  return date ? `${date}T00:00:00.000Z` : ''
}

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    ...opts,
  })
}

function fmtDateShort(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function effectiveEnd(range: Range): Date {
  const end = new Date(range.endDate)
  const bufferDays = range.applyReturnBuffer ? (range.returnBufferDays ?? 2) : 0
  end.setDate(end.getDate() + bufferDays)
  end.setHours(23, 59, 59, 999)
  return end
}

function getRangeStatus(range: Range): RangeStatus {
  if (!range.startDate || !range.endDate) return 'upcoming'
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const start = new Date(range.startDate)
  start.setHours(0, 0, 0, 0)
  const end = effectiveEnd(range)
  if (now > end) return 'past'
  if (now >= start) return 'active'
  return 'upcoming'
}

const STATUS_COLORS: Record<RangeStatus, string> = {
  active: '#fb923c',
  upcoming: '#1db48e',
  past: '#3a3a3a',
}

const STATUS_LABELS: Record<RangeStatus, string> = {
  active: 'Active',
  upcoming: 'Upcoming',
  past: 'Past',
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 7h16" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 1v2M13 1v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M16 11.5V6.5L9 3L2 6.5v5l7 3.5 7-3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M2 6.5l7 3.5 7-3.5M9 10v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.1 3.1l1.4 1.4M13.5 13.5l1.4 1.4M14.9 3.1l-1.4 1.4M4.5 13.5l-1.4 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 1.5C9 1.5 6.5 5 6.5 9s2.5 7.5 2.5 7.5M9 1.5C9 1.5 11.5 5 11.5 9S9 16.5 9 16.5M1.5 9H16.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true" style={{ opacity: 0.55 }}>
      <path d="M2 4L5.5 7.5L9 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M2 4h11M5 4V2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5V4M6 7v4M9 7v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 4l.7 8.3A.7.7 0 0 0 4.4 13h6.2a.7.7 0 0 0 .7-.7L12 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M10.5 2.5l2 2L5 12H3v-2l7.5-7.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9 4l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Dashboard switcher flyout
// ---------------------------------------------------------------------------

function DashboardSwitcher({ onClose, anchorTop, anchorLeft }: {
  onClose: () => void; anchorTop: number; anchorLeft: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', top: anchorTop, left: anchorLeft,
        width: 280, background: '#161616',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
        boxShadow: '0 16px 48px rgba(0,0,0,0.7)', overflow: 'hidden', zIndex: 300,
      }}
    >
      <div style={{ padding: '0.5rem' }}>
        {SWITCHER.map(s => (
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a
            key={s.href}
            href={s.href}
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.75rem', borderRadius: 7, textDecoration: 'none', transition: 'background 0.1s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              {s.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#d6d1ce', fontFamily: ui }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#5a5a5a', fontFamily: ui }}>{s.desc}</p>
            </div>
          </a>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '0.5rem' }}>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/admin"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.75rem', borderRadius: 7, textDecoration: 'none', color: '#9b9a9a', fontSize: '0.82rem', fontFamily: ui, transition: 'background 0.1s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#d6d1ce' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
        >
          <DashboardIcon />
          View Dashboard
        </a>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sidebar nav item
// ---------------------------------------------------------------------------

function NavItem({ icon, label, href, active, collapsed, external }: {
  icon: React.ReactNode; label: string; href: string; active?: boolean; collapsed?: boolean; external?: boolean
}) {
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '0.65rem',
    padding: collapsed ? '0.6rem' : '0.55rem 0.75rem',
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: 7, fontSize: '0.85rem', fontFamily: ui, fontWeight: active ? 500 : 400,
    color: active ? '#e6e1de' : '#5a5a5a',
    background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
    textDecoration: 'none', cursor: 'pointer', transition: 'background 0.12s, color 0.12s',
  }
  const inner = (
    <>
      {icon}
      {!collapsed && <span>{label}</span>}
    </>
  )
  if (external) {
    return (
      // eslint-disable-next-line @next/next/no-html-link-for-pages
      <a href={href} style={style} title={collapsed ? label : undefined}
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#9b9a9a' } }}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#5a5a5a' } }}
      >{inner}</a>
    )
  }
  return (
    <a href={href} style={style} title={collapsed ? label : undefined}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#9b9a9a' } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#5a5a5a' } }}
    >{inner}</a>
  )
}

// ---------------------------------------------------------------------------
// Add / Edit modal
// ---------------------------------------------------------------------------

const EMPTY_FORM: FormData = {
  internalLabel: '',
  startDate: '',
  endDate: '',
  applyReturnBuffer: true,
  returnBufferDays: 2,
  customerMessage: "I'm currently away. Please check back on {returnDate} to book a session.",
}

function RangeModal({
  initial,
  onSave,
  onClose,
}: {
  initial: FormData
  onSave: (f: FormData) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<FormData>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const firstFieldRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!form.internalLabel.trim()) errs.internalLabel = 'Required'
    if (!form.startDate) errs.startDate = 'Required'
    if (!form.endDate) errs.endDate = 'Required'
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      errs.endDate = 'Must be on or after start date'
    if (!form.customerMessage.trim()) errs.customerMessage = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (validate()) onSave(form)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.75rem', boxSizing: 'border-box',
    background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, color: '#e6e1de', fontSize: '0.85rem', fontFamily: ui, outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 500,
    color: '#9b9a9a', fontFamily: ui, marginBottom: '0.35rem', letterSpacing: '0.04em',
    textTransform: 'uppercase',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="range-modal-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#161616', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: '1.75rem', width: 520, maxWidth: 'calc(100vw - 2rem)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h2 id="range-modal-title" style={{ margin: '0 0 1.5rem', fontSize: '1.05rem', fontWeight: 600, color: '#d6d1ce', fontFamily: ui }}>
          {initial.internalLabel ? 'Edit blocked range' : 'New blocked range'}
        </h2>

        <div style={{ marginBottom: '1.1rem' }}>
          <label htmlFor="avail-label" style={labelStyle}>Internal label (private)</label>
          <input
            id="avail-label"
            ref={firstFieldRef}
            type="text"
            value={form.internalLabel}
            onChange={e => set('internalLabel', e.target.value)}
            placeholder='e.g. "Vacation" or "Wedding weekend"'
            style={{ ...inputStyle, borderColor: errors.internalLabel ? '#ef4444' : 'rgba(255,255,255,0.12)' }}
          />
          {errors.internalLabel && (
            <p role="alert" style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444', fontFamily: ui }}>{errors.internalLabel}</p>
          )}
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: '#5a5a5a', fontFamily: ui }}>
            Only visible to you - never shown to clients.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.1rem' }}>
          <div>
            <label htmlFor="avail-start" style={labelStyle}>First unavailable day</label>
            <input
              id="avail-start"
              type="date"
              value={form.startDate}
              onChange={e => set('startDate', e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.startDate ? '#ef4444' : 'rgba(255,255,255,0.12)',
                colorScheme: 'dark',
              }}
            />
            {errors.startDate && (
              <p role="alert" style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444', fontFamily: ui }}>{errors.startDate}</p>
            )}
          </div>
          <div>
            <label htmlFor="avail-end" style={labelStyle}>Last unavailable day</label>
            <input
              id="avail-end"
              type="date"
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={e => set('endDate', e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.endDate ? '#ef4444' : 'rgba(255,255,255,0.12)',
                colorScheme: 'dark',
              }}
            />
            {errors.endDate && (
              <p role="alert" style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444', fontFamily: ui }}>{errors.endDate}</p>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '1.1rem', padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.applyReturnBuffer}
              onChange={e => set('applyReturnBuffer', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#1db48e', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.85rem', fontFamily: ui, color: '#d6d1ce', fontWeight: 500 }}>
              Add recovery buffer after return
            </span>
          </label>
          {form.applyReturnBuffer && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input
                id="avail-buffer"
                type="number"
                min={0}
                max={30}
                value={form.returnBufferDays}
                onChange={e => set('returnBufferDays', Math.max(0, parseInt(e.target.value) || 0))}
                style={{ ...inputStyle, width: 72, textAlign: 'center' }}
                aria-label="Recovery buffer days"
              />
              <label htmlFor="avail-buffer" style={{ fontSize: '0.82rem', color: '#9b9a9a', fontFamily: ui }}>
                extra days after your last unavailable day
              </label>
            </div>
          )}
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: '#5a5a5a', fontFamily: ui }}>
            Gives you time to catch up before new sessions begin.
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="avail-message" style={labelStyle}>Message to clients</label>
          <textarea
            id="avail-message"
            value={form.customerMessage}
            onChange={e => set('customerMessage', e.target.value)}
            rows={3}
            style={{
              ...inputStyle,
              resize: 'vertical', lineHeight: 1.55,
              borderColor: errors.customerMessage ? '#ef4444' : 'rgba(255,255,255,0.12)',
            }}
          />
          {errors.customerMessage && (
            <p role="alert" style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444', fontFamily: ui }}>{errors.customerMessage}</p>
          )}
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: '#5a5a5a', fontFamily: ui }}>
            Use <code style={{ background: 'rgba(255,255,255,0.07)', padding: '0.05em 0.3em', borderRadius: 3 }}>{'{returnDate}'}</code> as a placeholder for the computed return date.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.6rem 1.1rem', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7,
              color: '#9b9a9a', fontSize: '0.85rem', fontFamily: ui, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              padding: '0.6rem 1.25rem', background: '#b45309',
              border: 'none', borderRadius: 7,
              color: '#fff', fontSize: '0.85rem', fontFamily: ui, cursor: 'pointer', fontWeight: 500,
            }}
          >
            {initial.internalLabel ? 'Save changes' : 'Add range'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status banner
// ---------------------------------------------------------------------------

function StatusBanner({ ranges }: { ranges: Range[] }) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const activeRange = ranges.find(r => getRangeStatus(r) === 'active')
  const upcomingRanges = ranges
    .filter(r => getRangeStatus(r) === 'upcoming')
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  const nextRange = upcomingRanges[0]

  if (activeRange) {
    const end = effectiveEnd(activeRange)
    const returnStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    return (
      <div style={{
        padding: '0.75rem 1rem', background: 'rgba(251,146,60,0.1)',
        border: '1px solid rgba(251,146,60,0.25)', borderRadius: 8, marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fb923c', flexShrink: 0 }} />
        <span style={{ fontSize: '0.85rem', fontFamily: ui, color: '#fed7aa' }}>
          <strong style={{ color: '#fb923c' }}>Out of office:</strong> {activeRange.internalLabel} - back {returnStr}
        </span>
      </div>
    )
  }

  if (nextRange) {
    const startStr = fmtDate(nextRange.startDate)
    const daysAway = Math.ceil((new Date(nextRange.startDate).getTime() - now.getTime()) / 86400000)
    return (
      <div style={{
        padding: '0.75rem 1rem', background: 'rgba(29,180,142,0.08)',
        border: '1px solid rgba(29,180,142,0.2)', borderRadius: 8, marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1db48e', flexShrink: 0 }} />
        <span style={{ fontSize: '0.85rem', fontFamily: ui, color: '#a7f3d0' }}>
          <strong style={{ color: '#1db48e' }}>Next:</strong> {nextRange.internalLabel} starts {startStr} ({daysAway === 1 ? 'tomorrow' : `in ${daysAway} days`})
        </span>
      </div>
    )
  }

  return (
    <div style={{
      padding: '0.75rem 1rem', background: 'rgba(74,222,128,0.08)',
      border: '1px solid rgba(74,222,128,0.15)', borderRadius: 8, marginBottom: '1.5rem',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
      <span style={{ fontSize: '0.85rem', fontFamily: ui, color: '#bbf7d0' }}>
        <strong style={{ color: '#4ade80' }}>Available</strong> - no blocked dates scheduled
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Range card
// ---------------------------------------------------------------------------

function RangeCard({
  range,
  onEdit,
  onDelete,
}: {
  range: Range
  onEdit: () => void
  onDelete: () => void
}) {
  const status = getRangeStatus(range)
  const statusColor = STATUS_COLORS[status]
  const end = effectiveEnd(range)
  const bufferDays = range.applyReturnBuffer ? (range.returnBufferDays ?? 2) : 0

  const dateLabel = range.startDate && range.endDate
    ? (fmtDateShort(range.startDate) === fmtDateShort(range.endDate)
        ? fmtDate(range.startDate)
        : `${fmtDateShort(range.startDate)} - ${fmtDate(range.endDate)}`)
    : 'No dates set'

  const returnStr = fmtDate(end.toISOString())

  return (
    <div style={{
      background: '#111', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '1rem 1.1rem',
      opacity: status === 'past' ? 0.5 : 1,
      transition: 'opacity 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: statusColor, fontFamily: ui, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {STATUS_LABELS[status]}
            </span>
          </div>

          <p style={{ margin: '0 0 0.2rem', fontSize: '0.95rem', fontWeight: 600, color: '#d6d1ce', fontFamily: ui }}>
            {range.internalLabel || 'Untitled'}
          </p>

          <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#9b9a9a', fontFamily: ui }}>
            {dateLabel}
            {bufferDays > 0 && (
              <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.45rem', background: 'rgba(255,255,255,0.06)', borderRadius: 4, fontSize: '0.72rem', color: '#6b6663' }}>
                +{bufferDays}d buffer - returns {returnStr}
              </span>
            )}
          </p>

          {range.customerMessage && (
            <p style={{
              margin: 0, fontSize: '0.78rem', color: '#5a5a5a', fontFamily: ui,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', lineHeight: 1.5,
            }}>
              &ldquo;{range.customerMessage.replace('{returnDate}', returnStr)}&rdquo;
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${range.internalLabel}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 6,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#9b9a9a', cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#e6e1de' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
          >
            <EditIcon />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${range.internalLabel}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 6,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#9b9a9a', cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.color = '#f87171' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AvailabilityEditorClient({ initialRanges }: { initialRanges: Range[] }) {
  const [ranges, setRanges] = useState<Range[]>(initialRanges)
  const [originalJson, setOriginalJson] = useState(JSON.stringify(initialRanges))
  const hasChanges = JSON.stringify(ranges) !== originalJson

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [collapsed, setCollapsed] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [switcherPos, setSwitcherPos] = useState({ top: 0, left: 0 })
  const switcherBtnRef = useRef<HTMLButtonElement>(null)

  const handleSwitcherOpen = useCallback(() => {
    const rect = switcherBtnRef.current?.getBoundingClientRect()
    if (rect) setSwitcherPos({ top: rect.bottom + 6, left: rect.left })
    setShowSwitcher(s => !s)
  }, [])

  const sortedRanges = [...ranges].sort((a, b) => {
    const order: Record<RangeStatus, number> = { active: 0, upcoming: 1, past: 2 }
    const sa = getRangeStatus(a), sb = getRangeStatus(b)
    if (sa !== sb) return order[sa] - order[sb]
    return (a.startDate || '').localeCompare(b.startDate || '')
  })

  function openAdd() {
    setEditingIndex(null)
    setModalOpen(true)
  }

  function openEdit(range: Range) {
    const idx = ranges.indexOf(range)
    setEditingIndex(idx)
    setModalOpen(true)
  }

  function deleteRange(range: Range) {
    setRanges(rs => rs.filter(r => r !== range))
  }

  function handleModalSave(form: FormData) {
    const newRange: Range = {
      id: editingIndex !== null ? ranges[editingIndex]?.id : undefined,
      notificationSent: editingIndex !== null ? ranges[editingIndex]?.notificationSent : undefined,
      internalLabel: form.internalLabel,
      startDate: inputToIso(form.startDate),
      endDate: inputToIso(form.endDate),
      applyReturnBuffer: form.applyReturnBuffer,
      returnBufferDays: form.returnBufferDays,
      customerMessage: form.customerMessage,
    }
    if (editingIndex !== null) {
      setRanges(rs => rs.map((r, i) => i === editingIndex ? newRange : r))
    } else {
      setRanges(rs => [...rs, newRange])
    }
    setModalOpen(false)
    setEditingIndex(null)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaveMsg('')
    try {
      const res = await fetch('/api/globals/availability', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedRanges: ranges }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const updated = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const saved = (updated as any)?.blockedRanges ?? []
      setRanges(saved)
      setOriginalJson(JSON.stringify(saved))
      setSaveMsg('Saved')
      setTimeout(() => setSaveMsg(''), 2500)
    } catch (err) {
      setError('Save failed. Please try again.')
      console.error('[availability] save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const editingRange = editingIndex !== null ? ranges[editingIndex] : null
  const modalInitial: FormData = editingRange ? {
    internalLabel: editingRange.internalLabel,
    startDate: isoToInput(editingRange.startDate),
    endDate: isoToInput(editingRange.endDate),
    applyReturnBuffer: editingRange.applyReturnBuffer,
    returnBufferDays: editingRange.returnBufferDays ?? 2,
    customerMessage: editingRange.customerMessage,
  } : EMPTY_FORM

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0c0c0c' }}>

      {showSwitcher && (
        <DashboardSwitcher
          onClose={() => setShowSwitcher(false)}
          anchorTop={switcherPos.top}
          anchorLeft={switcherPos.left}
        />
      )}

      {modalOpen && (
        <RangeModal
          initial={modalInitial}
          onSave={handleModalSave}
          onClose={() => { setModalOpen(false); setEditingIndex(null) }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 56 : 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: '#0e0e0e', borderRight: '1px solid rgba(255,255,255,0.06)',
        transition: 'width 0.2s ease', overflow: 'hidden',
      }}>
        {/* Brand switcher */}
        <div style={{ padding: collapsed ? '0.65rem 0.5rem' : '0.65rem 0.75rem' }}>
          <button
            ref={switcherBtnRef}
            type="button"
            onClick={handleSwitcherOpen}
            aria-expanded={showSwitcher}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              width: '100%', padding: collapsed ? '0.55rem' : '0.55rem 0.65rem',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 8, cursor: 'pointer', textAlign: 'left',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>📅</span>
            {!collapsed && (
              <>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d6d1ce', fontFamily: ui, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Bookings</span>
                <ChevronDownIcon />
              </>
            )}
          </button>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 0.5rem 0.5rem' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: collapsed ? '0 0.25rem' : '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <NavItem href="/availability" icon={<CalendarIcon />} label="Availability" active collapsed={collapsed} />
          <NavItem href="/admin/collections/services" icon={<PackageIcon />} label="Services" collapsed={collapsed} external />
          <NavItem href="/admin/globals/booking-settings" icon={<GearIcon />} label="Booking Settings" collapsed={collapsed} external />

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0.5rem 0.25rem' }} />

          <NavItem href="https://tynnellhollinsphotography.com" icon={<GlobeIcon />} label="View Website" collapsed={collapsed} external />
          <NavItem href="/site-settings" icon={<GearIcon />} label="Site Settings" collapsed={collapsed} external />
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: collapsed ? '0.65rem 0.25rem' : '0.65rem 0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end',
              width: '100%', padding: '0.4rem 0.5rem',
              background: 'transparent', border: 'none',
              color: '#3a3a3a', cursor: 'pointer', borderRadius: 6,
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9b9a9a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3a3a3a' }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between',
          padding: '0 1.5rem', height: 58,
          borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
        }}>
          <h1 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#d6d1ce', fontFamily: ui }}>
            Availability &amp; OOO
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {saveMsg && (
              <span style={{ fontSize: '0.8rem', color: '#4ade80', fontFamily: ui }}>{saveMsg}</span>
            )}
            {error && (
              <span role="alert" style={{ fontSize: '0.8rem', color: '#f87171', fontFamily: ui }}>{error}</span>
            )}
            <button
              type="button"
              onClick={openAdd}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 7, color: '#d6d1ce', fontSize: '0.82rem', fontFamily: ui,
                cursor: 'pointer', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.11)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)' }}
            >
              <PlusIcon />
              Add Range
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || saving}
              aria-busy={saving}
              style={{
                padding: '0.5rem 1rem',
                background: hasChanges ? '#b45309' : 'rgba(255,255,255,0.04)',
                border: 'none', borderRadius: 7,
                color: hasChanges ? '#fff' : '#3a3a3a',
                fontSize: '0.82rem', fontFamily: ui, fontWeight: 500,
                cursor: hasChanges && !saving ? 'pointer' : 'default',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <StatusBanner ranges={ranges} />

            {hasChanges && (
              <div style={{
                padding: '0.65rem 0.9rem', background: 'rgba(180,83,9,0.1)',
                border: '1px solid rgba(180,83,9,0.25)', borderRadius: 7, marginBottom: '1.5rem',
                fontSize: '0.8rem', color: '#fbbf24', fontFamily: ui,
              }}>
                You have unsaved changes. Click &ldquo;Save Changes&rdquo; to publish them.
              </div>
            )}

            {sortedRanges.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '4rem 2rem',
                border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10,
              }}>
                <CalendarIcon />
                <p style={{ margin: '1rem 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#d6d1ce', fontFamily: ui }}>
                  No blocked dates
                </p>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#5a5a5a', fontFamily: ui }}>
                  Add a range to block out vacation, personal time, or recovery periods.
                </p>
                <button
                  type="button"
                  onClick={openAdd}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.6rem 1.1rem', background: '#b45309',
                    border: 'none', borderRadius: 7, color: '#fff',
                    fontSize: '0.85rem', fontFamily: ui, cursor: 'pointer', fontWeight: 500,
                  }}
                >
                  <PlusIcon />
                  Add your first range
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {sortedRanges.map(range => (
                  <RangeCard
                    key={range.id ?? range.internalLabel + range.startDate}
                    range={range}
                    onEdit={() => openEdit(range)}
                    onDelete={() => deleteRange(range)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
