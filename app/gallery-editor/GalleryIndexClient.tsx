'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'

const CATEGORIES = ['weddings', 'portraits', 'families', 'couples', 'brands'] as const

export type GalleryCard = {
  id: number
  title: string
  slug: string | null
  category: string | null
  status: string
  photoCount: number
  coverThumb: string | null
}

const ui = "var(--font-heading, Archivo, sans-serif)"

export function GalleryIndexClient({ galleries }: { galleries: GalleryCard[] }) {
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<string>('portraits')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [filterCat, setFilterCat] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [orderedGalleries, setOrderedGalleries] = useState<GalleryCard[]>(galleries)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [reordering, setReordering] = useState(false)
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const moveGallery = (from: number, to: number) => {
    if (from === to) return
    const next = [...orderedGalleries]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setOrderedGalleries(next)
    if (reorderTimer.current) clearTimeout(reorderTimer.current)
    reorderTimer.current = setTimeout(async () => {
      setReordering(true)
      await Promise.all(next.map((g, i) =>
        fetch(`/api/galleries/${g.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: (i + 1) * 10 }),
        })
      ))
      setReordering(false)
    }, 800)
  }

  const createGallery = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), category: newCategory, status: 'draft' }),
      })
      if (res.ok) {
        const data = await res.json() as { doc?: { id: number } }
        const id = data.doc?.id
        if (id) window.location.href = `/gallery-editor/${id}`
      } else {
        setCreateError('Could not create gallery. Please try again.')
      }
    } catch {
      setCreateError('Could not create gallery. Check your connection.')
    }
    setCreating(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0e0e0e', color: '#e6e1de' }}>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-gallery-title"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          onKeyDown={e => { if (e.key === 'Escape') setShowModal(false) }}
        >
          <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '2rem', width: 380, display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <h2 id="new-gallery-title" style={{ margin: 0, fontFamily: ui, fontSize: '1.1rem', fontWeight: 600, color: '#e6e1de', letterSpacing: '-0.01em' }}>Create new gallery</h2>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#9b9a9a', fontFamily: ui }}>Gallery name</span>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void createGallery() }}
                placeholder="e.g. Smith Wedding"
                autoFocus
                style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '0.6rem 0.75rem', color: '#e6e1de', fontSize: '0.9rem', outline: 'none', fontFamily: ui }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#9b9a9a', fontFamily: ui }}>Category</span>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '0.6rem 0.75rem', color: '#e6e1de', fontSize: '0.9rem', outline: 'none', fontFamily: ui, cursor: 'pointer' }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </label>
            {createError && <p role="alert" style={{ margin: 0, fontSize: '0.78rem', color: '#f0a3a3', fontFamily: ui }}>{createError}</p>}
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#9b9a9a', borderRadius: 6, padding: '0.5rem 1.1rem', fontSize: '0.85rem', cursor: 'pointer', fontFamily: ui, fontWeight: 500 }}>Cancel</button>
              <button type="button" onClick={() => void createGallery()} disabled={!newTitle.trim() || creating} aria-busy={creating} style={{ background: '#1db954', border: 'none', color: '#fff', borderRadius: 6, padding: '0.5rem 1.3rem', fontSize: '0.85rem', fontWeight: 600, cursor: (!newTitle.trim() || creating) ? 'not-allowed' : 'pointer', fontFamily: ui, opacity: (!newTitle.trim() || creating) ? 0.5 : 1 }}>
                {creating ? 'Creating...' : 'Create gallery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header style={{ height: 58, borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', flexShrink: 0 }}>
        <span style={{ fontFamily: ui, fontSize: '0.95rem', fontWeight: 600, color: '#d6d1ce', letterSpacing: '-0.01em' }}>Galleries</span>
        <button
          type="button"
          onClick={() => { setNewTitle(''); setCreateError(''); setShowModal(true) }}
          style={{ background: '#1db954', border: 'none', color: '#fff', borderRadius: 6, padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: ui }}
        >
          + New gallery
        </button>
      </header>

      {/* Gallery grid */}
      <main style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        {galleries.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
            {(['all', ...CATEGORIES] as const).map(cat => {
              const active = cat === 'all' ? filterCat === null : filterCat === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCat(cat === 'all' ? null : cat)}
                  aria-pressed={active}
                  style={{ background: active ? 'rgba(255,255,255,0.1)' : 'none', border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`, color: active ? '#e6e1de' : '#4b4b4b', borderRadius: 20, padding: '0.28rem 0.75rem', fontSize: '0.72rem', fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: ui, textTransform: 'capitalize', transition: 'all .12s' }}
                >
                  {cat}
                </button>
              )
            })}
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.07)', margin: '0 0.2rem' }} aria-hidden="true" />
            {(['live', 'draft'] as const).map(s => {
              const active = filterStatus === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterStatus(active ? null : s)}
                  aria-pressed={active}
                  style={{ background: active ? (s === 'live' ? 'rgba(29,185,84,0.15)' : 'rgba(255,255,255,0.07)') : 'none', border: `1px solid ${active ? (s === 'live' ? 'rgba(29,185,84,0.35)' : 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.07)'}`, color: active ? (s === 'live' ? '#1db954' : '#9b9a9a') : '#4b4b4b', borderRadius: 20, padding: '0.28rem 0.75rem', fontSize: '0.72rem', fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: ui, textTransform: 'capitalize', transition: 'all .12s' }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        )}
        {galleries.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '6rem' }}>
            <div style={{ fontSize: '3.5rem', opacity: 0.08, marginBottom: '1.25rem' }} aria-hidden="true">&#128444;</div>
            <p style={{ fontFamily: ui, fontSize: '1rem', fontWeight: 500, color: '#4b4b4b', margin: '0 0 1.5rem' }}>No galleries yet</p>
            <button
              type="button"
              onClick={() => { setNewTitle(''); setCreateError(''); setShowModal(true) }}
              style={{ background: '#1db954', border: 'none', color: '#fff', borderRadius: 6, padding: '0.6rem 1.4rem', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: ui }}
            >
              Create your first gallery
            </button>
          </div>
        ) : (
          <>
            {(() => {
              const isFiltered = !!(filterCat || filterStatus)
              const filtered = orderedGalleries.filter(g =>
                (!filterCat || g.category === filterCat) &&
                (!filterStatus || (filterStatus === 'live' ? g.status !== 'draft' : g.status === 'draft'))
              )
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#3a3a3a', fontFamily: ui }}>
                      {filtered.length === orderedGalleries.length
                        ? `${orderedGalleries.length} ${orderedGalleries.length === 1 ? 'gallery' : 'galleries'}`
                        : `${filtered.length} of ${orderedGalleries.length}`}
                    </p>
                    {reordering && <span style={{ fontSize: '0.7rem', color: '#4b4b4b', fontFamily: ui }}>Saving order...</span>}
                    {isFiltered && <span style={{ fontSize: '0.7rem', color: '#3a3a3a', fontFamily: ui }}>Clear filters to drag-reorder</span>}
                    {!isFiltered && !reordering && <span style={{ fontSize: '0.7rem', color: '#2a2a2a', fontFamily: ui }}>Drag to reorder</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {filtered.map((g) => {
                      const realIdx = orderedGalleries.indexOf(g)
                      const isDragging = dragIdx === realIdx
                      const isOver = overIdx === realIdx && dragIdx !== null && dragIdx !== realIdx
                      return (
                <Link
                  key={g.id}
                  href={`/gallery-editor/${g.id}`}
                  draggable={!isFiltered}
                  onDragStart={e => { if (isFiltered) { e.preventDefault(); return }; e.dataTransfer.effectAllowed = 'move'; setDragIdx(realIdx) }}
                  onDragEnter={() => { if (!isFiltered && dragIdx !== null && dragIdx !== realIdx) setOverIdx(realIdx) }}
                  onDragOver={e => { if (!isFiltered) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' } }}
                  onDrop={e => { if (!isFiltered && dragIdx !== null) { e.preventDefault(); moveGallery(dragIdx, realIdx); setDragIdx(null); setOverIdx(null) } }}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                  style={{ textDecoration: 'none', display: 'block', borderRadius: 8, overflow: 'hidden', background: '#141414', border: `1px solid ${isOver ? 'rgba(29,185,84,0.5)' : 'rgba(255,255,255,0.06)'}`, transition: 'border-color .15s, transform .15s, opacity .12s', opacity: isDragging ? 0.35 : 1, cursor: !isFiltered ? 'grab' : 'pointer', transform: isOver ? 'scale(1.02)' : 'scale(1)' }}
                  onMouseEnter={e => { if (!isDragging) { (e.currentTarget as HTMLElement).style.borderColor = isOver ? 'rgba(29,185,84,0.5)' : 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                >
                  {/* Cover image */}
                  <div style={{ aspectRatio: '16/10', background: '#1a1a1a', overflow: 'hidden', position: 'relative' }}>
                    {g.coverThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.coverThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span aria-hidden="true" style={{ fontSize: '2rem', opacity: 0.1 }}>&#128444;</span>
                      </div>
                    )}
                    {/* Status badge */}
                    <span style={{
                      position: 'absolute', top: '0.6rem', right: '0.6rem',
                      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                      padding: '0.2rem 0.5rem', borderRadius: 20, fontFamily: ui,
                      background: g.status === 'draft' ? 'rgba(0,0,0,0.65)' : 'rgba(29,185,84,0.2)',
                      color: g.status === 'draft' ? '#6b6a6a' : '#1db954',
                      border: `1px solid ${g.status === 'draft' ? 'rgba(255,255,255,0.08)' : 'rgba(29,185,84,0.35)'}`,
                      backdropFilter: 'blur(4px)',
                    }}>
                      {g.status === 'draft' ? 'Draft' : 'Live'}
                    </span>
                  </div>

                  {/* Card info */}
                  <div style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontFamily: ui, fontSize: '0.88rem', fontWeight: 600, color: '#d6d1ce', letterSpacing: '-0.01em', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#4b4b4b', fontFamily: ui, textTransform: 'capitalize' }}>{g.category ?? 'uncategorized'}</span>
                      {g.photoCount > 0 && (
                        <>
                          <span style={{ fontSize: '0.6rem', color: '#2a2a2a' }} aria-hidden="true">&#8226;</span>
                          <span style={{ fontSize: '0.7rem', color: '#4b4b4b', fontFamily: ui }}>{g.photoCount} photo{g.photoCount !== 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
                  </div>
                </>
              )
            })()}
          </>
        )}
      </main>
    </div>
  )
}
