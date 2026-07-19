'use client'

import { useCallback, useEffect, useRef } from 'react'
import { themeToCssVarMap, type SiteTheme } from '@/app/lib/siteTheme'

// Shared pieces between the standalone /design editor (DesignClient.tsx) and
// the embedded Design tab inside the /builder Website hub (SiteEditorClient.tsx),
// so both present the exact same controls instead of two diverging copies.

export const FONT_OPTIONS: { label: string; value: SiteTheme['headingFont'] }[] = [
  { label: 'Poppins', value: 'poppins' },
  { label: 'Tangerine', value: 'tangerine' },
  { label: 'Abril Fatface', value: 'abril' },
]
export const SPACING_OPTIONS: { label: string; value: SiteTheme['spacingScale'] }[] = [
  { label: 'Compact', value: 'compact' },
  { label: 'Normal', value: 'normal' },
  { label: 'Spacious', value: 'spacious' },
]
export const BUTTON_OPTIONS: { label: string; value: SiteTheme['buttonStyle'] }[] = [
  { label: 'Sharp', value: 'sharp' },
  { label: 'Rounded', value: 'rounded' },
  { label: 'Pill', value: 'pill' },
]

export const COLOR_FIELDS: { key: keyof Pick<SiteTheme, 'colorBg' | 'colorBgAccent' | 'colorHeading' | 'colorBody' | 'colorDetail' | 'colorBtnBg'>; label: string }[] = [
  { key: 'colorBg', label: 'Background color' },
  { key: 'colorBgAccent', label: 'Accent background color' },
  { key: 'colorHeading', label: 'Heading text color' },
  { key: 'colorBody', label: 'Body text color' },
  { key: 'colorDetail', label: 'Detail / muted text color' },
  { key: 'colorBtnBg', label: 'Button color' },
]

// TYN-338: the taped/polaroid photo-frame treatment (gallery album, portfolio
// teaser, about headshot, blog cards, builder PhotoGallery block) used to be a
// hardcoded sitewide constant. tapeColor is usually an rgba() value, not a
// hex, so its swatch preview in ColorInput won't parse - the text field still
// accepts and applies any valid CSS color.
export const TAPE_FIELDS: { key: keyof Pick<SiteTheme, 'tapeMatColor' | 'tapeColor'>; label: string }[] = [
  { key: 'tapeMatColor', label: 'Photo mat color' },
  { key: 'tapeColor', label: 'Tape strip color' },
]

export function AccordionRow({ label, isOpen, onToggle, children }: { label: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
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

export function FieldLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <label style={{ display: 'block', color: '#9b9a9a', fontSize: 11.5, marginBottom: 6, ...style }}>{children}</label>
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: string) => void; options: { label: string; value: T }[] }) {
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

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

// Renders the full set of accordion sections (Logo & Branding, Fonts, Colors,
// Animations, Spacing, Buttons) for a given theme + setter, so both consumers
// share one implementation of "what the controls look like."
export function DesignSections({
  theme, set, open, setOpen, ImagePickerField,
}: {
  theme: SiteTheme
  set: <K extends keyof SiteTheme>(key: K, value: SiteTheme[K]) => void
  open: string | null
  setOpen: (s: string | null) => void
  ImagePickerField: React.ComponentType<{ value?: string; onChange: (v: string) => void }>
}) {
  return (
    <>
      <AccordionRow label="Logo & Branding" isOpen={open === 'logo'} onToggle={() => setOpen(open === 'logo' ? null : 'logo')}>
        <FieldLabel>Logo image</FieldLabel>
        <ImagePickerField value={theme.logoUrl} onChange={(v) => set('logoUrl', v)} />
        <p style={{ color: '#6b6a6a', fontSize: 11, marginTop: 8 }}>Leave empty to show the text wordmark instead of an image.</p>
        <FieldLabel style={{ marginTop: 16 }}>Favicon</FieldLabel>
        <ImagePickerField value={theme.faviconUrl} onChange={(v) => set('faviconUrl', v)} />
        <p style={{ color: '#6b6a6a', fontSize: 11, marginTop: 8 }}>Shown in the browser tab. Leave empty to use the site&apos;s default favicon.</p>
      </AccordionRow>

      <AccordionRow label="Watermark" isOpen={open === 'watermark'} onToggle={() => setOpen(open === 'watermark' ? null : 'watermark')}>
        <FieldLabel>Watermark image</FieldLabel>
        <ImagePickerField value={theme.watermarkUrl} onChange={(v) => set('watermarkUrl', v)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e6e1de', fontSize: 13, cursor: 'pointer', marginTop: 12 }}>
          <input type="checkbox" checked={theme.watermarkEnabled} onChange={(e) => set('watermarkEnabled', e.target.checked)} />
          Apply watermark to gallery previews
        </label>
        <p style={{ color: '#6b6a6a', fontSize: 11, marginTop: 8 }}>
          Applies to new uploads only, on gallery/portfolio preview images. Photos a client downloads through &quot;Allow Photo
          Downloads&quot; are never watermarked.
        </p>
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

      <AccordionRow label="Photo Frame" isOpen={open === 'photoFrame'} onToggle={() => setOpen(open === 'photoFrame' ? null : 'photoFrame')}>
        {TAPE_FIELDS.map((f, i) => (
          <div key={f.key} style={{ marginTop: i === 0 ? 0 : 12 }}>
            <FieldLabel>{f.label}</FieldLabel>
            <ColorInput value={theme[f.key]} onChange={(v) => set(f.key, v)} />
          </div>
        ))}
        <p style={{ color: '#6b6a6a', fontSize: 11, marginTop: 8 }}>Used by the Taped and Polaroid photo styles across the portfolio, galleries, and builder.</p>
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
    </>
  )
}

// Real-time live-preview sync: posts the current theme to a preview target
// (an iframe's contentWindow, and/or a popped-out tab) on every change, and
// answers the DesignPreviewBridge's ready handshake so a (re)mounted preview
// gets the current draft immediately, not just on the next edit.
export function useDesignPreviewSync(theme: SiteTheme, active: boolean) {
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

  useEffect(() => {
    if (!active) return
    postToTarget(iframeRef.current?.contentWindow)
    if (previewWinRef.current && !previewWinRef.current.closed) postToTarget(previewWinRef.current)
  }, [theme, active, postToTarget])

  useEffect(() => {
    if (!active) return
    function handleReady(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if ((event.data as { type?: string } | undefined)?.type !== 'THP_DESIGN_PREVIEW_READY') return
      postToTarget(event.source as Window)
    }
    window.addEventListener('message', handleReady)
    return () => window.removeEventListener('message', handleReady)
  }, [active, postToTarget])

  const openPreviewTab = useCallback((href: string) => {
    const sep = href.includes('?') ? '&' : '?'
    const win = window.open(`${href}${sep}__designPreview=1`, '_blank')
    previewWinRef.current = win
  }, [])

  return { iframeRef, openPreviewTab }
}
