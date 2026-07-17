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

export function SiteSettingsClient({ initial }: { initial: SiteSettingsData }) {
  const [data, setData] = useState<SiteSettingsData>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof SiteSettingsData>(key: K, value: SiteSettingsData[K]) => {
    setSaved(false)
    setData((d) => ({ ...d, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/site-settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
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

        <div
          style={{
            background: 'rgba(251,146,60,0.08)',
            border: '1px solid rgba(251,146,60,0.25)',
            borderRadius: 8,
            padding: '0.85rem 1rem',
            marginBottom: '2rem',
            color: '#fb923c',
            fontSize: '0.8rem',
            lineHeight: 1.5,
          }}
        >
          Not yet wired into the live site - these fields save to the database but the public site currently reads business
          name, tagline, contact info, and social links from hardcoded values in the code instead. See TYN-326 to connect them.
        </div>

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
