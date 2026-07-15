'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ImagePickerField } from '@/app/builder/ImagePickerField'
import { DesignSections, useDesignPreviewSync } from '@/app/builder/DesignPanelShared'
import type { SiteTheme } from '@/app/lib/siteTheme'

export function DesignClient({ initialTheme }: { initialTheme: SiteTheme }) {
  const [theme, setTheme] = useState<SiteTheme>(initialTheme)
  const [open, setOpen] = useState<string | null>('logo')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { iframeRef, openPreviewTab } = useDesignPreviewSync(theme, true)

  const set = <K extends keyof SiteTheme>(key: K, value: SiteTheme[K]) => {
    setSaved(false)
    setTheme((t) => ({ ...t, [key]: value }))
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
          <DesignSections theme={theme} set={set} open={open} setOpen={setOpen} ImagePickerField={ImagePickerField} />
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e1e1e', display: 'flex', gap: 10 }}>
          <button type="button" onClick={() => openPreviewTab('/')} style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: '1px solid #2a2a2a', background: 'transparent', color: '#e6e1de', fontSize: 13, cursor: 'pointer' }}>
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
