'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { MonthRevenue } from './page'

const ui = 'var(--font-heading, Archivo), sans-serif'

// ---------------------------------------------------------------------------
// Nav icons
// ---------------------------------------------------------------------------

function HomeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
}
function ProjectsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
}
function ContactsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
}
function InboxIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
}
function PaymentsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
}
function BookingsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
}
function DocumentsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
}
function TemplatesIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
}
function SettingsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
}
function BellIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
}
function ChevronDownIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
}
function PlusCircleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
}
function InfoIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
}

// ---------------------------------------------------------------------------
// Create document icons (document-style illustrations matching Pixieset)
// ---------------------------------------------------------------------------

function DocIllustration({ lines = 3, hasCircle = false, hasPen = false, hasClip = false, hasTable = false }: {
  lines?: number; hasCircle?: boolean; hasPen?: boolean; hasClip?: boolean; hasTable?: boolean
}) {
  return (
    <svg width="52" height="64" viewBox="0 0 52 64" fill="none" aria-hidden="true">
      <rect x="4" y="2" width="44" height="60" rx="4" fill="#1e1e1e" stroke="#2e2e2e" strokeWidth="1.5"/>
      <rect x="4" y="2" width="32" height="60" rx="4" fill="#1a1a1a" stroke="#2e2e2e" strokeWidth="1.5"/>
      {hasClip && <rect x="20" y="0" width="12" height="6" rx="2" fill="#2a2a2a" stroke="#3a3a3a" strokeWidth="1"/>}
      {Array.from({ length: lines }).map((_, i) => (
        <rect key={i} x="10" y={16 + i * 10} width={i === lines - 1 ? 18 : 26} height="2.5" rx="1.2" fill="#3a3a3a"/>
      ))}
      {hasCircle && <circle cx="18" cy="46" r="7" stroke="#4ade80" strokeWidth="1.5" fill="none"/>}
      {hasPen && <path d="M28 44l8-8 4 4-8 8-4 0 0-4z" stroke="#9b9a9a" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
      {hasTable && (
        <>
          <rect x="8" y="38" width="28" height="18" rx="1.5" stroke="#3a3a3a" strokeWidth="1.2" fill="none"/>
          <line x1="8" y1="44" x2="36" y2="44" stroke="#3a3a3a" strokeWidth="1"/>
          <line x1="20" y1="38" x2="20" y2="56" stroke="#3a3a3a" strokeWidth="1"/>
        </>
      )}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Revenue chart
// ---------------------------------------------------------------------------

function RevenueChart({ data }: { data: MonthRevenue[] }) {
  const W = 900
  const H = 200
  const PAD = { top: 20, right: 20, bottom: 40, left: 60 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...data.map(d => d.amount), 1)
  const yTicks = 5
  const tickStep = Math.ceil(maxVal / yTicks / 50) * 50 || 50
  const yMax = tickStep * yTicks

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * plotW,
    y: PAD.top + plotH - (d.amount / yMax) * plotH,
    label: d.label,
    amount: d.amount,
  }))

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = [
    `M${pts[0].x},${PAD.top + plotH}`,
    ...pts.map(p => `L${p.x},${p.y}`),
    `L${pts[pts.length - 1].x},${PAD.top + plotH}`,
    'Z',
  ].join(' ')

  const labelEvery = Math.ceil(data.length / 6)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#059669" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Y-axis grid lines */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = PAD.top + plotH - (i / yTicks) * plotH
        const val = (i / yTicks) * yMax
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="#1e1e1e" strokeWidth="1"/>
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#555" fontFamily={ui}>
              ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={area} fill="url(#chartGrad)"/>

      {/* Line */}
      <polyline points={polyline} fill="none" stroke="#059669" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>

      {/* Data points */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#059669" stroke="#111" strokeWidth="1.5"/>
      ))}

      {/* X-axis labels */}
      {pts.map((p, i) => i % labelEvery === 0 && (
        <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="11" fill="#555" fontFamily={ui}>
          {p.label.split(' ')[0]}
        </text>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { label: 'Home', icon: <HomeIcon />, href: '/studio-manager', active: true },
  { label: 'Projects', icon: <ProjectsIcon />, href: '/studio-manager/projects' },
  { label: 'Contacts', icon: <ContactsIcon />, href: '/studio-manager/contacts' },
  { label: 'Inbox', icon: <InboxIcon />, href: '/studio-manager/inbox' },
]

const TOOL_ITEMS = [
  { label: 'Payments', icon: <PaymentsIcon />, href: '/studio-manager/payments' },
  { label: 'Bookings', icon: <BookingsIcon />, href: '/admin/globals/booking-settings' },
  { label: 'Documents', icon: <DocumentsIcon />, href: '/studio-manager/documents' },
  { label: 'Templates', icon: <TemplatesIcon />, href: '/studio-manager/templates' },
  { label: 'Settings', icon: <SettingsIcon />, href: '/admin/globals/booking-settings' },
]

function NavItem({ label, icon, href, active }: { label: string; icon: React.ReactNode; href: string; active?: boolean }) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '9px 12px', borderRadius: 7, textDecoration: 'none',
      color: active ? '#e6e1de' : '#666',
      background: active ? '#1e1e1e' : 'transparent',
      fontSize: 14, fontFamily: ui, fontWeight: active ? 500 : 400,
      transition: 'color 0.1s, background 0.1s',
    }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#aaa'; (e.currentTarget as HTMLElement).style.background = '#161616' } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#666'; (e.currentTarget as HTMLElement).style.background = 'transparent' } }}
    >
      {icon}
      {label}
    </Link>
  )
}

function Sidebar({ userName }: { userName: string }) {
  const initials = userName.includes('@')
    ? userName[0].toUpperCase()
    : userName.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)

  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropOpen) return
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropOpen])

  return (
    <aside style={{
      width: 220, minWidth: 220,
      background: '#0f0f0f',
      borderRight: '1px solid #1a1a1a',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      overflow: 'hidden',
    }}>
      {/* Top bar inside sidebar */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', borderBottom: '1px solid #1a1a1a', flexShrink: 0,
      }}>
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6,
              color: '#e6e1de',
            }}
          >
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#059669', flexShrink: 0 }}/>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: ui }}>Studio Manager</span>
            <ChevronDownIcon />
          </button>

          {dropOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4,
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)', padding: '6px 0', minWidth: 180,
            }}>
              {[
                { label: 'Studio', href: '/studio' },
                { label: 'Photo Library', href: '/photo-library' },
                { label: 'Website Builder', href: '/builder' },
                { label: 'Admin', href: '/admin' },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setDropOpen(false)} style={{
                  display: 'block', padding: '8px 14px', textDecoration: 'none',
                  color: '#b0aba8', fontSize: 13, fontFamily: ui,
                }}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 4, borderRadius: 6 }}>
            <BellIcon />
          </button>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: '#2dd4bf',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#111', fontFamily: ui, flexShrink: 0, cursor: 'pointer',
          }}>
            {initials}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.label} {...item} />
        ))}

        <div style={{ margin: '16px 12px 6px', fontSize: 10, fontWeight: 600, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: ui }}>
          Tools
        </div>

        {TOOL_ITEMS.map(item => (
          <NavItem key={item.label} {...item} />
        ))}
      </nav>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Create section
// ---------------------------------------------------------------------------

const CREATE_ITEMS = [
  { label: 'Project', illustration: <DocIllustration lines={3} />, href: '/studio-manager/projects/new' },
  { label: 'Invoice', illustration: <DocIllustration lines={4} hasCircle />, href: '/studio-manager/invoices/new' },
  { label: 'Contract', illustration: <DocIllustration lines={3} hasPen />, href: '/studio-manager/contracts/new' },
  { label: 'Questionnaire', illustration: <DocIllustration lines={5} />, href: '/studio-manager/questionnaires/new' },
  { label: 'Quote', illustration: <DocIllustration lines={3} hasClip />, href: '/studio-manager/quotes/new' },
  { label: 'Session', illustration: <DocIllustration lines={2} hasTable />, href: '/admin/globals/booking-settings' },
]

function CreateCard({ label, illustration, href }: { label: string; illustration: React.ReactNode; href: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        padding: '24px 16px 16px',
        background: hovered ? '#1a1a1a' : '#141414',
        border: `1px solid ${hovered ? '#2a2a2a' : '#1e1e1e'}`,
        borderRadius: 10, textDecoration: 'none', cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        minHeight: 140, gap: 12,
      }}
    >
      {illustration}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2dd4bf', fontSize: 13, fontFamily: ui, fontWeight: 500 }}>
        <PlusCircleIcon />
        {label}
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props = {
  greeting: string
  today: string
  monthlyRevenue: MonthRevenue[]
  totalRevenue: number
  userName: string
}

export function StudioManagerClient({ greeting, today, monthlyRevenue, totalRevenue, userName }: Props) {
  const [revenueWindow, setRevenueWindow] = useState<'12mo' | '6mo' | '30d'>('12mo')

  const filteredRevenue = revenueWindow === '12mo'
    ? monthlyRevenue
    : revenueWindow === '6mo'
      ? monthlyRevenue.slice(-6)
      : monthlyRevenue.slice(-1)

  const filteredTotal = filteredRevenue.reduce((s, m) => s + m.amount, 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#111' }}>
      <Sidebar userName={userName} />

      <main style={{ flex: 1, padding: '2.5rem 2.5rem', overflowY: 'auto' }}>
        {/* Greeting */}
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.6rem', fontWeight: 700, color: '#e6e1de', fontFamily: ui }}>
          {greeting}
        </h1>
        <p style={{ margin: '0 0 2.5rem', fontSize: 13, color: '#555', fontFamily: ui }}>{today}</p>

        {/* Create */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: 12, fontWeight: 600, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: ui }}>
            Create
          </h2>
          <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '1.25rem' }}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {CREATE_ITEMS.map(item => (
              <CreateCard key={item.label} {...item} />
            ))}
          </div>
        </section>

        {/* Payments */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: ui }}>
              Payments
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['12mo', '6mo', '30d'] as const).map(w => (
                <button
                  key={w}
                  onClick={() => setRevenueWindow(w)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: '1px solid',
                    borderColor: revenueWindow === w ? '#2dd4bf' : '#2a2a2a',
                    background: revenueWindow === w ? 'rgba(45,212,191,0.08)' : 'transparent',
                    color: revenueWindow === w ? '#2dd4bf' : '#555',
                    fontSize: 11, fontFamily: ui, cursor: 'pointer',
                  }}
                >
                  {w === '12mo' ? 'Last 12 months' : w === '6mo' ? 'Last 6 months' : 'Last 30 days'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '1.5rem' }}/>

          <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 10, padding: '1.5rem 1.75rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#555', fontFamily: ui }}>Total revenue</span>
                <span style={{ color: '#444' }}><InfoIcon /></span>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: '#e6e1de', fontFamily: ui }}>
                ${filteredTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <RevenueChart data={filteredRevenue} />
          </div>
        </section>
      </main>
    </div>
  )
}
