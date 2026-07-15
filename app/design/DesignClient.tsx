'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ImagePickerField } from '@/app/builder/ImagePickerField'
import { themeToCssVarMap, type SiteTheme } from '@/app/lib/siteTheme'

type Section = 'logo' | 'fonts' | 'colors' | 'animations' | 'spacing' | 'buttons'

const FONT_OPTIONS: { label: string; value: SiteTheme['headingFont'] }[] = [
  { label: 'Poppins', value: 'poppins' },
  { label: 'Tangerine', value: 'tangerine' },
  { label: 'Abril Fatface', value: 'abril' },
]
const SPACING_OPTIONS: { label: string; value: SiteTheme['spacingScale'] }[] = [
  { label: 'Compact', value: 'compact' },
  { label: 'Normal', value: 'normal' },
  { label: 'Spacious', value: 'spacious' },
]
const BUTTON_OPTIONS: { label: string; value: SiteTheme['buttonStyle'] }[] = [
  { label: 'Sharp', value: 'sharp' },
  { label: 'Rounded', value: 'rounded' },
  { label: 'Pill', value: 'pill' },
]

const COLOR_FIELDS: { key: keyof Pick<SiteTheme, 'colorBg' | 'colorBgAccent' | 'colorHeading' | 'colorBody' | 'colorDetail' | 'colorBtnBg'>; label: string }[] = [
  { key: 'colorBg', label: 'Background color' },
  { key: 'colorBgAccent', label: 'Accent background color' },
  { key: 'colorHeading', label: 'Heading text color' },
  { key: 'colorBody', label: 'Body text color' },
  { key: 'colorDetail', label: 'Detail / muted text color' },
  { key: 'colorBtnBg', label: 'Button color' },
]

export function DesignClient({ initialTheme }: { initialTheme: SiteTheme }) {
  const [theme, setTheme] = useState<SiteTheme>(initialTheme)
  const [open, setOpen] = useState<Section | null>('logo')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewWinRef = useRef<Window | null>(null)
  const themeRef = useRef(theme)
  themeRef.current = theme

  const postToTarget = useCallback((win: Window | null | undefined) => {
    if (!win) return
    win.postMessage(
      { type: 'THP_DESIGN_PREVIEW', vars: themeToCssVarMap(themeRef.current), animationsEnabled: themeRef.current.animationsEnabled },
      window.location.origin,
    )
  }, [])

  // Push the latest draft state to the live preview iframe (and an optional
  // popped-out preview tab) on every change - this is what makes the editor
  // feel like Pixieset's as-you-type preview, with nothing persisted yet.
  useEffect(() => {
    postToTarget(iframeRef.current?.contentWindow)
    if (previewWinRef.current && !previewWinRef.current.closed) postToTarget(previewWinRef.current)
  }, [theme, postToTarget])

  // Answer the preview bridge's "ready" handshake (fires on iframe load and
  // whenever a popped-out preview tab's bridge mounts) with the current draft.
  useEffect(() => {
    function handleReady(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if ((event.data as { type?: string } | undefined)?.type !== 'THP_DESIGN_PREVIEW_READY') return
      postToTarget(event.source as Window)
    }
    window.addEventListener('message', handleReady)
    return () => window.removeEventListener('message', handleReady)
  }, [postToTarget])

  const set = <K extends keyof SiteTheme>(key: K, value: SiteTheme[K]) => {
    setSaved(false)
    setTheme((t) => ({ ...t, [key]: value }))
  }

  const openPreviewTab = () => {
    const win = window.open('/?__designPreview=1', '_blank')
    previewWinRef.current = win
  }

  const publish = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/design/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a', fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      <aside style={{ width: 320, minWidth: 320, background: '#0f0f0f', borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/studio" style={{ color: '#9b9a9a', fontSize: 13, textDecoration: 'none' }}>&larr; Studio</Link>
          <span style={{ color: '#e6e1de', fontWeight: 600, fontSize: 14 }}>Design</span>
        </div>

        <div style={{ padding: '18px 20px 8px' }}>
          <p style={{ margin: '0 0 10px', color: '#6b6a6a', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Template</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#1a1a1a', borderRadius: 6, border: '1px solid #232323' }}>
            <div style={{ width: 44, height: 44, borderRadius: 4, background: 'linear-gradient(135deg,#2dd4bf,#0ea5e9)', flexShrink: 0 }} />
            <div>
              <div style={{ color: '#e6e1de', fontSize: 13, fontWeight: 600 }}>Editorial</div>
              <div style={{ color: '#6b6a6a', fontSize: 11 }}>Your site&apos;s current design</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '10px 20px 20px', flex: 1 }}>
          <p style={{ margin: '10px 0', color: '#6b6a6a', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Template Options</p>

          <AccordionRow label="Logo & Branding" isOpen={open === 'logo'} onToggle={() => setOpen(open === 'logo' ? null : 'logo')}>
            <FieldLabel>Logo image</FieldLabel>
            <ImagePickerField value={theme.logoUrl} onChange={(v) => set('logoUrl', v)} />
            <p style={{ color: '#6b6a6a', fontSize: 11, marginTop: 8 }}>Leave empty to show the text wordmark instead of an image.</p>
          </AccordionRow>

          <AccordionRow label="Fonts" isOpen={open === 'fonts'} onToggle={() => setOpen(open === 'fonts' ? null : 'fonts')}>
            <FieldLabel>Heading font</FieldLabel>
            <Select value={theme.headingFont} onChange={(v) => set('headingFont', v as SiteTheme['headingFont'])} options={FONT_OPTIONS} />
            <FieldLabel style={{ marginTop: 12 }}>Body font</FieldLabel>
            <Select value={theme.bodyFont} onChange={(v) => set('bodyFont', v as SiteTheme['bodyFont'])} options={FONT_OPTIONS} />
          </AccordionRow>

          <AccordionRow label="Colors" isOpen={open === 'colors'} onToggle={() => setOpen(open === 'colors' ? null : 'colors')}>
            {COLOR_FIELDS.map((f, i) => (
              <div key={f.key} style={{ marginTop: i === 0 ? 0 : 12 }}>
                <FieldLabel>{f.label}</FieldLabel>
                <ColorInput value={theme[f.key]} onChange={(v) => set(f.key, v)} />
              </div>
            ))}
          </AccordionRow>

          <AccordionRow label="Animations" isOpen={open === 'animations'} onToggle={() => setOpen(open === 'animations' ? null : 'animations')}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e6e1de', fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={theme.animationsEnabled} onChange={(e) => set('animationsEnabled', e.target.checked)} />
              Enable animations
            </label>
            <p style={{ color: '#6b6a6a', fontSize: 11, marginTop: 8 }}>Turns off decorative transitions/animations sitewide when unchecked.</p>
          </AccordionRow>

          <AccordionRow label="Spacing" isOpen={open === 'spacing'} onToggle={() => setOpen(open === 'spacing' ? null : 'spacing')}>
            <FieldLabel>Overall spacing</FieldLabel>
            <Select value={theme.spacingScale} onChange={(v) => set('spacingScale', v as SiteTheme['spacingScale'])} options={SPACING_OPTIONS} />
          </AccordionRow>

          <AccordionRow label="Buttons" isOpen={open === 'buttons'} onToggle={() => setOpen(open === 'buttons' ? null : 'buttons')}>
            <FieldLabel>Button shape</FieldLabel>
            <Select value={theme.buttonStyle} onChange={(v) => set('buttonStyle', v as SiteTheme['buttonStyle'])} options={BUTTON_OPTIONS} />
          </AccordionRow>
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e1e1e', display: 'flex', gap: 10 }}>
          <button type="button" onClick={openPreviewTab} style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: '1px solid #2a2a2a', background: 'transparent', color: '#e6e1de', fontSize: 13, cursor: 'pointer' }}>
            Preview
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={saving}
            style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: 'none', background: '#2dd4bf', color: '#0a0a0a', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Publishing...' : saved ? 'Published' : 'Publish'}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, background: '#050505', display: 'flex', alignItems: 'stretch' }}>
        <iframe
          ref={iframeRef}
          src="/?__designPreview=1"
          title="Live site preview"
          style={{ border: 'none', width: '100%', height: '100%' }}
        />
      </main>
    </div>
  )
}

function AccordionRow({ label, isOpen, onToggle, children }: { label: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid #1a1a1a' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 4px', background: 'none', border: 'none', color: '#e6e1de', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
      >
        {label}
        <span style={{ color: '#6b6a6a', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>&#9660;</span>
      </button>
      {isOpen && <div style={{ padding: '2px 4px 16px' }}>{children}</div>}
    </div>
  )
}

function FieldLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <label style={{ display: 'block', color: '#9b9a9a', fontSize: 11.5, marginBottom: 6, ...style }}>{children}</label>
}

function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: string) => void; options: { label: string; value: T }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', background: '#1a1a1a', color: '#e6e1de', border: '1px solid #2a2a2a', borderRadius: 5, padding: '8px 10px', fontSize: 13 }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 36, height: 32, padding: 0, border: '1px solid #2a2a2a', borderRadius: 4, background: 'none', cursor: 'pointer' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, background: '#1a1a1a', color: '#e6e1de', border: '1px solid #2a2a2a', borderRadius: 5, padding: '7px 10px', fontSize: 13, fontFamily: 'monospace' }}
      />
    </div>
  )
}
