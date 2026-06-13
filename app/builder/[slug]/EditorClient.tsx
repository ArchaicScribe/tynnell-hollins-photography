'use client'

import { Puck, type Data } from '@measured/puck'
import '@measured/puck/puck.css'
import '../puck-theme.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { config } from '../puck.config'

// Per-page Puck editor (TYN-216). Saves the document for `slug` via the save
// API; Publish marks the page published so it renders at /{slug}. Puck's
// preview iframe is disabled so the save fetch keeps the session cookie.
//
// Robustness layer (TYN-228): tracks unsaved changes, warns before leaving
// with edits in flight, shows a plain-English status pill, and offers a short
// in-editor help panel for a non-technical user.
type SaveState = 'idle' | 'saving' | 'error'

export function EditorClient({
  slug,
  title,
  published,
  initialData,
}: {
  slug: string
  title: string
  published: boolean
  initialData: Data
}) {
  const savedJson = useRef<string>(JSON.stringify(initialData))
  const [dirty, setDirty] = useState(false)
  const [isPublished, setIsPublished] = useState(published)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [showHelp, setShowHelp] = useState(false)

  // Warn on tab close / reload while there are unsaved edits.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const onChange = useCallback((data: Data) => {
    setDirty(JSON.stringify(data) !== savedJson.current)
  }, [])

  const onPublish = async (data: Data) => {
    setSaveState('saving')
    try {
      const res = await fetch('/api/builder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slug, data }),
      })
      if (res.ok) {
        savedJson.current = JSON.stringify(data)
        setDirty(false)
        setIsPublished(true)
        setSaveState('idle')
      } else {
        setSaveState('error')
      }
    } catch {
      setSaveState('error')
    }
  }

  // Plain-English status shown in the header.
  const pill =
    saveState === 'saving'
      ? { label: 'Saving...', bg: '#3a3320', fg: '#e8c468', bd: '#7a6a2e' }
      : saveState === 'error'
        ? { label: 'Save failed - try again', bg: '#3a2020', fg: '#e88', bd: '#7a2e2e' }
        : dirty
          ? { label: 'Unsaved changes', bg: '#3a3320', fg: '#e8c468', bd: '#7a6a2e' }
          : isPublished
            ? { label: 'Live on site', bg: '#1f3320', fg: '#7fcf86', bd: '#2e5a33' }
            : { label: 'Draft - not live yet', bg: '#262626', fg: '#9b9a9a', bd: '#3a3a3a' }

  const guardLeave = (e: React.MouseEvent) => {
    if (dirty && !window.confirm('You have unsaved changes. Leave without publishing?')) {
      e.preventDefault()
    }
  }

  const headerBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0 0.85rem',
    height: '34px',
    borderRadius: '4px',
    border: '1px solid var(--puck-color-grey-09, #d4d4d4)',
    color: 'inherit',
    textDecoration: 'none',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    background: 'transparent',
    cursor: 'pointer',
  }

  return (
    <div className="puck-dark" style={{ height: '100vh' }}>
      <Puck
        config={config}
        data={initialData}
        onChange={onChange}
        onPublish={onPublish}
        iframe={{ enabled: false }}
        headerTitle={title}
        headerPath={`/${slug}`}
        overrides={{
          headerActions: ({ children }) => (
            <>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 0.7rem',
                  height: '34px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  background: pill.bg,
                  color: pill.fg,
                  border: `1px solid ${pill.bd}`,
                }}
                title={
                  isPublished
                    ? `This page is live at /${slug}`
                    : 'Click Publish to make this page live on your site'
                }
              >
                {pill.label}
              </span>
              <button type="button" style={headerBtn} onClick={() => setShowHelp((v) => !v)} title="How the builder works">
                ? Help
              </button>
              <Link href="/builder" style={headerBtn} onClick={guardLeave}>
                &#8592; Pages
              </Link>
              {isPublished && (
                <Link
                  href={`/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={headerBtn}
                  title={`Open the live page at /${slug}`}
                >
                  View Page &#8599;
                </Link>
              )}
              {children}
            </>
          ),
        }}
      />

      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} isPublished={isPublished} />}
    </div>
  )
}

// Short, non-technical guide. Opens from the Help button, closes on overlay
// click or the X. Kept inline so it survives a CSS hiccup like the rest of the
// builder chrome.
function HelpPanel({ onClose, isPublished }: { onClose: () => void; isPublished: boolean }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(380px, 90vw)',
          height: '100%',
          background: '#161616',
          borderLeft: '1px solid rgba(155,154,154,0.2)',
          padding: '1.5rem 1.4rem',
          overflowY: 'auto',
          color: '#e6e1de',
          fontFamily: "var(--font-body, 'Roboto Mono', monospace)",
          fontSize: '0.85rem',
          lineHeight: 1.55,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <strong style={{ fontFamily: "var(--font-heading, Archivo, sans-serif)", color: '#d6d1ce', fontSize: '1rem' }}>
            How the builder works
          </strong>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help"
            style={{ background: 'transparent', border: 'none', color: '#9b9a9a', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        <Tip n="1" title="Add a section">
          Drag a block from the left panel onto the page, or click it. Blocks stack top to bottom.
        </Tip>
        <Tip n="2" title="Edit a section">
          Click any section on the page. Its settings (text, photos, colors) open in the right panel.
        </Tip>
        <Tip n="3" title="Add your photos">
          In a photo or image block, click Choose Photo to pick from your library, or upload a new one right there.
        </Tip>
        <Tip n="4" title="Reorder or remove">
          Use the arrows on a selected section to move it, or the trash icon to delete it.
        </Tip>
        <Tip n="5" title="Phone vs desktop">
          Sections resize for phones automatically. To hide one on a device, use the section&apos;s <strong>Show on phones</strong> / <strong>Show on desktop</strong> setting.
        </Tip>
        <Tip n="6" title="Publish">
          Click <strong>Publish</strong> (top right) to save and put your changes live. The status pill turns green when the page is live.
        </Tip>
        <Tip n="7" title="Put it in your menu or make it home">
          Back on the Pages list, use the <strong>In menu</strong> and <strong>Homepage</strong> toggles on each page.
        </Tip>

        <p style={{ color: '#9b9a9a', fontSize: '0.78rem', marginTop: '1.2rem', borderTop: '1px solid rgba(155,154,154,0.15)', paddingTop: '0.9rem' }}>
          {isPublished
            ? 'This page is published. Edits are not live until you click Publish again.'
            : 'This page is still a draft. Visitors cannot see it until you click Publish.'}
        </p>
      </div>
    </div>
  )
}

function Tip({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.95rem' }}>
      <span
        style={{
          flex: '0 0 auto',
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#d6d1ce',
          color: '#0c0c0c',
          fontSize: '0.72rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {n}
      </span>
      <span>
        <strong style={{ color: '#d6d1ce' }}>{title}.</strong>{' '}
        <span style={{ color: '#c8c3c0' }}>{children}</span>
      </span>
    </div>
  )
}
