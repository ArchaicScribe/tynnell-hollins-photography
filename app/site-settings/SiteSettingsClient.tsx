'use client'

import { useId, useState } from 'react'
import { ImagePickerField } from '@/app/builder/ImagePickerField'
import { DEFAULT_MENU_CARD_LINK_LABEL, MAX_MENU_CARDS, type MenuCard } from '@/app/lib/menuCards'
import { isSafeLink } from '@/app/lib/safeLink'

type SiteSettingsData = {
  title: string
  tagline: string
  email: string
  phone: string
  instagramUrl: string
  facebookUrl: string
  tiktokUrl: string
  pinterestUrl: string
  freebieTitle: string
  freebieUrl: string
  menuCards: MenuCard[]
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
  warning,
}: {
  label: string
  description: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  warning?: string
}) {
  const id = useId()
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label htmlFor={id} style={{ display: 'block', color: '#D6D1CE', fontSize: '0.85rem', fontWeight: 600, fontFamily: ui, marginBottom: '0.5rem' }}>
        {label}
      </label>
      <input
        id={id}
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
      {warning ? (
        <p role="alert" style={{ margin: '0.5rem 0 0', color: '#fb923c', fontSize: '0.78rem', lineHeight: 1.5, maxWidth: 480 }}>
          {warning}
        </p>
      ) : (
        <p style={{ margin: '0.5rem 0 0', color: '#6b6a6a', fontSize: '0.78rem', lineHeight: 1.5, maxWidth: 480 }}>
          {description}
        </p>
      )}
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
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      style={{
        background: '#161616',
        border: '1px solid rgba(155,154,154,0.18)',
        borderRadius: 8,
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}
    >
      <h2 id={headingId} style={{ margin: '0 0 1.25rem', color: '#D6D1CE', fontSize: '1rem', fontWeight: 600, fontFamily: ui, letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

const inputStyle: React.CSSProperties = {
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
}

const smallLabel: React.CSSProperties = { display: 'block', color: '#D6D1CE', fontSize: '0.8rem', fontWeight: 600, fontFamily: ui, margin: '0 0 0.4rem' }

// One "Work with me" card in the full-screen menu (Rising Roots gap 4).
// Inputs carry real <label>s, so each one is announced by name.
function MenuCardEditor({ index, card, onChange, onRemove }: {
  index: number
  card: MenuCard
  onChange: (card: MenuCard) => void
  onRemove: () => void
}) {
  const id = useId()
  const set = <K extends keyof MenuCard>(key: K, value: MenuCard[K]) => onChange({ ...card, [key]: value })
  const hrefIsBad = card.href.trim() !== '' && !isSafeLink(card.href.trim())
  // The save route drops a card with no title or no link (app/lib/menuCards.ts),
  // so say so here rather than let it vanish after Save. A brand new, still
  // empty card is left alone.
  const hasAny = [card.title, card.href, card.linkLabel, card.imageUrl].some((v) => v.trim() !== '')
  const incomplete = hasAny && (card.title.trim() === '' || card.href.trim() === '')
  const problem = hrefIsBad
    ? 'This link won\'t be saved. Use a page like /services or an https:// address.'
    : incomplete
      ? 'This card needs a title and a link before it will be saved.'
      : ''

  return (
    <div style={{ border: '1px solid rgba(155,154,154,0.18)', borderRadius: 6, padding: '1rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ color: '#9B9A9A', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Card {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove card ${index + 1}`}
          style={{ background: 'transparent', border: '1px solid rgba(155,154,154,0.3)', borderRadius: 6, color: '#D6D1CE', fontSize: '0.75rem', padding: '0.3rem 0.7rem', cursor: 'pointer', fontFamily: ui }}
        >
          Remove
        </button>
      </div>

      <label htmlFor={`${id}-title`} style={smallLabel}>Card title</label>
      <input id={`${id}-title`} value={card.title} onChange={(e) => set('title', e.target.value)} placeholder="The wedding experience" style={{ ...inputStyle, marginBottom: '1rem' }} />

      <label htmlFor={`${id}-href`} style={smallLabel}>Link</label>
      <input id={`${id}-href`} value={card.href} onChange={(e) => set('href', e.target.value)} placeholder="/services" style={inputStyle} />
      {problem ? (
        <p role="alert" style={{ margin: '0.4rem 0 1rem', color: '#fb923c', fontSize: '0.78rem', lineHeight: 1.5 }}>
          {problem}
        </p>
      ) : (
        <p style={{ margin: '0.4rem 0 1rem', color: '#6b6a6a', fontSize: '0.78rem', lineHeight: 1.5 }}>
          A page on your site, like /services, or a full https:// address.
        </p>
      )}

      <label htmlFor={`${id}-label`} style={smallLabel}>Link text</label>
      <input id={`${id}-label`} value={card.linkLabel} onChange={(e) => set('linkLabel', e.target.value)} placeholder={DEFAULT_MENU_CARD_LINK_LABEL} style={{ ...inputStyle, marginBottom: '1rem' }} />

      <div role="group" aria-labelledby={`${id}-photo`}>
        <span id={`${id}-photo`} style={smallLabel}>Photo (optional)</span>
        <ImagePickerField value={card.imageUrl} onChange={(v) => set('imageUrl', v)} />
      </div>
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

        <Section title="Freebie">
          <p style={{ margin: '0 0 1rem', color: '#9B9A9A', fontSize: '0.82rem', lineHeight: 1.5 }}>
            The free guide emailed to anyone who signs up through an Email Signup block set to Freebie. Until a link is
            added here, those signups are still collected but no email is sent.
          </p>
          <Field
            label="Guide title"
            description='Used in the email subject and heading. Example: "The Wedding Planning Guide".'
            value={data.freebieTitle}
            onChange={(v) => set('freebieTitle', v)}
          />
          <Field
            label="Link to the guide"
            description="The full https:// address of the guide, for example where the PDF is stored."
            value={data.freebieUrl}
            onChange={(v) => set('freebieUrl', v)}
            placeholder="https://..."
            warning={
              data.freebieUrl.trim() && !isSafeLink(data.freebieUrl.trim())
                ? "This link won't be saved, and the one already saved will be kept. Use a full https:// address."
                : undefined
            }
          />
        </Section>

        <Section title="Menu cards">
          <p style={{ margin: '0 0 1rem', color: '#9B9A9A', fontSize: '0.82rem', lineHeight: 1.5 }}>
            Up to two &quot;Work with me&quot; cards in the full-screen menu, each with a photo and a link, for example to
            your wedding and portrait pages. Leave this empty and the menu shows only your pages.
          </p>
          {data.menuCards.map((card, i) => (
            <MenuCardEditor
              key={i}
              index={i}
              card={card}
              onChange={(next) => set('menuCards', data.menuCards.map((c, j) => (j === i ? next : c)))}
              onRemove={() => set('menuCards', data.menuCards.filter((_, j) => j !== i))}
            />
          ))}
          {data.menuCards.length < MAX_MENU_CARDS && (
            <button
              type="button"
              onClick={() => set('menuCards', [...data.menuCards, { title: '', linkLabel: '', href: '', imageUrl: '' }])}
              style={{ background: 'transparent', border: '1px dashed rgba(155,154,154,0.4)', borderRadius: 6, color: '#D6D1CE', fontSize: '0.82rem', padding: '0.55rem 1rem', cursor: 'pointer', fontFamily: ui }}
            >
              Add a card
            </button>
          )}
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
