'use client'

import { useState } from 'react'

type SiteSettingsData = {
  title: string
  tagline: string
  email: string
  phone: string
  instagramUrl: string
  facebookUrl: string
  tiktokUrl: string
  pinterestUrl: string
}

type GalleryPresetsData = {
  defaultCategory: string
  defaultStatus: string
  defaultTapedStyle: boolean
  defaultFeatured: boolean
  defaultAllowDownload: boolean
}

type EmailTemplatesData = {
  shareSubject: string
  shareHeading: string
  shareBody: string
  shareButtonLabel: string
  reminderSubject: string
  reminderHeading: string
  reminderBody: string
  reminderButtonLabel: string
  reminderDaysBefore: string
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'No default (always choose manually)' },
  { value: 'weddings', label: 'Weddings' },
  { value: 'portraits', label: 'Portraits' },
  { value: 'families', label: 'Families' },
  { value: 'couples', label: 'Couples' },
  { value: 'brands', label: 'Brands' },
]

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
]

const ui = "'Archivo', sans-serif"

function Field({
  label,
  description,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  description: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', color: '#D6D1CE', fontSize: '0.85rem', fontWeight: 600, fontFamily: ui, marginBottom: '0.5rem' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '0.65rem 0.85rem',
          background: '#1a1a1a',
          border: '1px solid rgba(155,154,154,0.25)',
          borderRadius: 6,
          color: '#E6E1DE',
          fontSize: '0.9rem',
          fontFamily: ui,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <p style={{ margin: '0.5rem 0 0', color: '#6b6a6a', fontSize: '0.78rem', lineHeight: 1.5, maxWidth: 480 }}>
        {description}
      </p>
    </div>
  )
}

function SelectField({
  label,
  description,
  value,
  onChange,
  options,
}: {
  label: string
  description: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', color: '#D6D1CE', fontSize: '0.85rem', fontWeight: 600, fontFamily: ui, marginBottom: '0.5rem' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '0.65rem 0.85rem',
          background: '#1a1a1a',
          border: '1px solid rgba(155,154,154,0.25)',
          borderRadius: 6,
          color: '#E6E1DE',
          fontSize: '0.9rem',
          fontFamily: ui,
          outline: 'none',
          boxSizing: 'border-box',
          cursor: 'pointer',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <p style={{ margin: '0.5rem 0 0', color: '#6b6a6a', fontSize: '0.78rem', lineHeight: 1.5, maxWidth: 480 }}>
        {description}
      </p>
    </div>
  )
}

function TextAreaField({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', color: '#D6D1CE', fontSize: '0.85rem', fontWeight: 600, fontFamily: ui, marginBottom: '0.5rem' }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '0.65rem 0.85rem',
          background: '#1a1a1a',
          border: '1px solid rgba(155,154,154,0.25)',
          borderRadius: 6,
          color: '#E6E1DE',
          fontSize: '0.9rem',
          fontFamily: ui,
          outline: 'none',
          boxSizing: 'border-box',
          resize: 'vertical',
        }}
      />
      <p style={{ margin: '0.5rem 0 0', color: '#6b6a6a', fontSize: '0.78rem', lineHeight: 1.5, maxWidth: 480 }}>
        {description}
      </p>
    </div>
  )
}

function CheckboxField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#D6D1CE', fontSize: '0.85rem', fontWeight: 600, fontFamily: ui, cursor: 'pointer' }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
      <p style={{ margin: '0.5rem 0 0', color: '#6b6a6a', fontSize: '0.78rem', lineHeight: 1.5, maxWidth: 480 }}>
        {description}
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#161616',
        border: '1px solid rgba(155,154,154,0.18)',
        borderRadius: 8,
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}
    >
      <h2 style={{ margin: '0 0 1.25rem', color: '#D6D1CE', fontSize: '1rem', fontWeight: 600, fontFamily: ui, letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

export function SiteSettingsClient({
  initial,
  initialPresets,
  initialEmailTemplates,
}: {
  initial: SiteSettingsData
  initialPresets: GalleryPresetsData
  initialEmailTemplates: EmailTemplatesData
}) {
  const [data, setData] = useState<SiteSettingsData>(initial)
  const [presets, setPresets] = useState<GalleryPresetsData>(initialPresets)
  const [templates, setTemplates] = useState<EmailTemplatesData>(initialEmailTemplates)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof SiteSettingsData>(key: K, value: SiteSettingsData[K]) => {
    setSaved(false)
    setData((d) => ({ ...d, [key]: value }))
  }

  const setPreset = <K extends keyof GalleryPresetsData>(key: K, value: GalleryPresetsData[K]) => {
    setSaved(false)
    setPresets((p) => ({ ...p, [key]: value }))
  }

  const setTemplate = <K extends keyof EmailTemplatesData>(key: K, value: EmailTemplatesData[K]) => {
    setSaved(false)
    setTemplates((t) => ({ ...t, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const [siteRes, presetsRes, templatesRes] = await Promise.all([
        fetch('/api/site-settings/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        fetch('/api/gallery-presets/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(presets),
        }),
        fetch('/api/email-templates/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...templates,
            reminderDaysBefore: Number(templates.reminderDaysBefore) || 0,
          }),
        }),
      ])
      if (siteRes.ok && presetsRes.ok && templatesRes.ok) {
        setSaved(true)
      } else {
        setError('Failed to save. Please try again.')
      }
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: ui }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- cross-root-layout link, /studio has its own root layout */}
        <a
          href="/studio"
          style={{ display: 'inline-block', color: '#9b9a9a', fontSize: '0.8rem', textDecoration: 'none', marginBottom: '1.25rem' }}
        >
          &larr; Studio
        </a>

        <h1 style={{ margin: '0 0 1.25rem', color: '#E6E1DE', fontSize: '1.75rem', fontWeight: 600, fontFamily: ui, letterSpacing: '-0.01em' }}>
          Settings
        </h1>

        <Section title="Branding">
          <p style={{ margin: '0 0 1rem', color: '#9B9A9A', fontSize: '0.82rem', lineHeight: 1.5 }}>
            Logo and favicon are managed from the Design editor, alongside your site&apos;s colors and fonts.
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- cross-root-layout link, /design has its own root layout */}
          <a
            href="/design"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 6,
              border: '1px solid rgba(155,154,154,0.3)',
              color: '#D6D1CE',
              fontSize: '0.82rem',
              fontFamily: ui,
              textDecoration: 'none',
            }}
          >
            Open Design Editor &rarr;
          </a>
        </Section>

        <Section title="Business Info">
          <Field
            label="Business Name"
            description='Your business name as it appears in browser tabs and search results. Example: "Tynnell Hollins Photography".'
            value={data.title}
            onChange={(v) => set('title', v)}
          />
          <Field
            label="Brand Tagline"
            description="Your tagline shown on your homepage. Example: &quot;Capturing life's most meaningful moments&quot;."
            value={data.tagline}
            onChange={(v) => set('tagline', v)}
          />
        </Section>

        <Section title="Contact Info">
          <Field
            label="Contact Email"
            description="Your contact email address, displayed on your contact page."
            value={data.email}
            onChange={(v) => set('email', v)}
            type="email"
          />
          <Field
            label="Phone Number"
            description="Your phone number, displayed on your contact page."
            value={data.phone}
            onChange={(v) => set('phone', v)}
          />
        </Section>

        <Section title="Social Links">
          <Field
            label="Instagram Profile URL"
            description="Your full Instagram URL. Example: https://instagram.com/tynnellhollinsphotography"
            value={data.instagramUrl}
            onChange={(v) => set('instagramUrl', v)}
            placeholder="https://instagram.com/..."
          />
          <Field
            label="Facebook Page URL"
            description="Your full Facebook page URL."
            value={data.facebookUrl}
            onChange={(v) => set('facebookUrl', v)}
            placeholder="https://facebook.com/..."
          />
          <Field
            label="TikTok Profile URL"
            description="Your full TikTok profile URL."
            value={data.tiktokUrl}
            onChange={(v) => set('tiktokUrl', v)}
            placeholder="https://tiktok.com/@..."
          />
          <Field
            label="Pinterest Profile URL"
            description="Your full Pinterest profile URL."
            value={data.pinterestUrl}
            onChange={(v) => set('pinterestUrl', v)}
            placeholder="https://pinterest.com/..."
          />
        </Section>

        <Section title="Gallery Presets">
          <p style={{ margin: '0 0 1rem', color: '#9B9A9A', fontSize: '0.82rem', lineHeight: 1.5 }}>
            Defaults applied automatically whenever you create a new gallery, so you don&apos;t have to reconfigure the same
            options every time. You can still override any of these per-gallery.
          </p>
          <SelectField
            label="Default Category"
            description="Pre-selected category in the New Collection modal. Choose &quot;No default&quot; to always pick manually."
            value={presets.defaultCategory}
            onChange={(v) => setPreset('defaultCategory', v)}
            options={CATEGORY_OPTIONS}
          />
          <SelectField
            label="Default Status"
            description="Status applied to a gallery when it is first created."
            value={presets.defaultStatus}
            onChange={(v) => setPreset('defaultStatus', v)}
            options={STATUS_OPTIONS}
          />
          <CheckboxField
            label="Default to Taped Photo Style"
            description="New galleries start with the editorial taped-photo look already turned on."
            checked={presets.defaultTapedStyle}
            onChange={(v) => setPreset('defaultTapedStyle', v)}
          />
          <CheckboxField
            label="Default to Show on Homepage"
            description="New galleries start featured on the homepage."
            checked={presets.defaultFeatured}
            onChange={(v) => setPreset('defaultFeatured', v)}
          />
          <CheckboxField
            label="Default to Allow Photo Downloads"
            description="New galleries start with client photo downloads turned on."
            checked={presets.defaultAllowDownload}
            onChange={(v) => setPreset('defaultAllowDownload', v)}
          />
        </Section>

        <Section title="Email Templates">
          <p style={{ margin: '0 0 1rem', color: '#9B9A9A', fontSize: '0.82rem', lineHeight: 1.5 }}>
            Copy for the emails sent when you share a gallery with a client, and the automatic reminder sent before it
            expires.
          </p>

          <h3 style={{ margin: '0 0 0.75rem', color: '#D6D1CE', fontSize: '0.85rem', fontWeight: 600, fontFamily: ui }}>
            Collection Sharing Email
          </h3>
          <Field
            label="Subject"
            description="Available variables: {{clientName}}, {{galleryTitle}}"
            value={templates.shareSubject}
            onChange={(v) => setTemplate('shareSubject', v)}
          />
          <Field
            label="Heading"
            description="Available variables: {{clientName}}, {{galleryTitle}}"
            value={templates.shareHeading}
            onChange={(v) => setTemplate('shareHeading', v)}
          />
          <TextAreaField
            label="Body"
            description="Available variables: {{clientName}}, {{galleryTitle}}, {{passwordNote}} (only appears if the gallery is password protected)"
            value={templates.shareBody}
            onChange={(v) => setTemplate('shareBody', v)}
          />
          <Field
            label="Button Label"
            description="Text shown on the call-to-action button linking to the gallery."
            value={templates.shareButtonLabel}
            onChange={(v) => setTemplate('shareButtonLabel', v)}
          />

          <h3 style={{ margin: '2rem 0 0.75rem', color: '#D6D1CE', fontSize: '0.85rem', fontWeight: 600, fontFamily: ui }}>
            Expiry Reminder Email
          </h3>
          <Field
            label="Subject"
            description="Available variables: {{clientName}}, {{galleryTitle}}, {{expiresAt}}"
            value={templates.reminderSubject}
            onChange={(v) => setTemplate('reminderSubject', v)}
          />
          <Field
            label="Heading"
            description="Available variables: {{clientName}}, {{galleryTitle}}, {{expiresAt}}"
            value={templates.reminderHeading}
            onChange={(v) => setTemplate('reminderHeading', v)}
          />
          <TextAreaField
            label="Body"
            description="Available variables: {{clientName}}, {{galleryTitle}}, {{expiresAt}}"
            value={templates.reminderBody}
            onChange={(v) => setTemplate('reminderBody', v)}
          />
          <Field
            label="Button Label"
            description="Text shown on the call-to-action button linking to the gallery."
            value={templates.reminderButtonLabel}
            onChange={(v) => setTemplate('reminderButtonLabel', v)}
          />
          <Field
            label="Send Reminder (Days Before Expiry)"
            description="How many days before a gallery expires to send the reminder email."
            type="number"
            value={templates.reminderDaysBefore}
            onChange={(v) => setTemplate('reminderDaysBefore', v)}
          />
        </Section>

        {error && (
          <p role="alert" style={{ color: '#f0a3a3', fontSize: '0.82rem', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            padding: '0.7rem 1.5rem',
            borderRadius: 6,
            border: 'none',
            background: '#2dd4bf',
            color: '#0a0a0a',
            fontSize: '0.85rem',
            fontWeight: 600,
            fontFamily: ui,
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
