'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

const ui = "'Archivo', system-ui, sans-serif"

type Payment = { amount?: number | null; status?: string | null }

type ProjectDoc = {
  id: number
  title: string
  status: string
  clientName: string
  projectType?: string | null
  projectDate?: string | null
  payments?: Payment[] | null
}

const COLUMNS: { key: string; label: string }[] = [
  { key: 'inquiry', label: 'Inquiry' },
  { key: 'booked', label: 'Booked' },
  { key: 'post-production', label: 'Post-Production' },
  { key: 'delivered', label: 'Delivered' },
]

const TYPE_LABELS: Record<string, string> = {
  portrait: 'Portrait',
  wedding: 'Wedding',
  family: 'Family',
  couples: 'Couples',
  brand: 'Brand',
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function fmtAmount(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function paymentSummary(payments?: Payment[] | null): { paid: number; upcoming: number; pastDue: number } {
  const result = { paid: 0, upcoming: 0, pastDue: 0 }
  for (const p of payments ?? []) {
    const amount = typeof p.amount === 'number' ? p.amount : 0
    if (p.status === 'paid') result.paid += amount
    else if (p.status === 'past-due') result.pastDue += amount
    else result.upcoming += amount
  }
  return result
}

export function ProjectsKanbanView() {
  const [projects, setProjects] = useState<ProjectDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [toggleError, setToggleError] = useState('')
  const [dragId, setDragId] = useState<number | null>(null)
  const [overColumn, setOverColumn] = useState<string | null>(null)
  const [movingIds, setMovingIds] = useState<Set<number>>(new Set())

  const fetchProjects = useCallback(() => {
    setLoading(true)
    setLoadError('')
    fetch('/api/projects?limit=300&depth=0&where[status][not_equals]=archived', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then((data: { docs?: ProjectDoc[] }) => setProjects(data.docs ?? []))
      .catch(() => setLoadError("Couldn't load projects. Check your connection and try again."))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const moveProject = useCallback(async (id: number, newStatus: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
    setMovingIds(prev => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed')
    } catch {
      setToggleError("Couldn't move the project - please try again.")
      setTimeout(() => setToggleError(''), 3500)
      fetchProjects()
    } finally {
      setMovingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }, [fetchProjects])

  const handleDrop = (columnKey: string) => {
    setOverColumn(null)
    if (dragId === null) return
    const project = projects.find(p => p.id === dragId)
    setDragId(null)
    if (!project || project.status === columnKey) return
    void moveProject(dragId, columnKey)
  }

  return (
    <div style={{ padding: '1.5rem', fontFamily: ui }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--theme-text,#e6e1de)', margin: '0 0 1rem' }}>
        Projects
      </h1>

      {loadError && (
        <div role="alert" style={{ marginBottom: '1rem', padding: '0.6rem 0.9rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 4, fontSize: '0.8rem', color: '#f0a3a3' }}>
          {loadError}
        </div>
      )}
      {toggleError && (
        <div role="alert" style={{ marginBottom: '1rem', padding: '0.6rem 0.9rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 4, fontSize: '0.8rem', color: '#f0a3a3' }}>
          {toggleError}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {COLUMNS.map(col => (
            <div key={col.key} style={{ borderRadius: 8, padding: '3rem 1rem', background: 'var(--theme-elevation-100,#131313)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'start' }}>
          {COLUMNS.map(col => {
            const colProjects = projects.filter(p => p.status === col.key)
            const isOver = overColumn === col.key

            return (
              <div
                key={col.key}
                onDragEnter={() => dragId !== null && setOverColumn(col.key)}
                onDragOver={e => { if (dragId !== null) e.preventDefault() }}
                onDrop={e => { e.preventDefault(); handleDrop(col.key) }}
                style={{
                  background: isOver ? 'rgba(214,209,206,0.05)' : 'var(--theme-elevation-50,#1e1e1e)',
                  border: isOver ? '2px dashed rgba(214,209,206,0.35)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: '0.75rem',
                  minHeight: 200,
                  transition: 'background 0.1s, border-color 0.1s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em', color: 'var(--theme-text,#d6d1ce)' }}>
                    {col.label}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-dim,#9b9a9a)', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.05rem 0.5rem' }}>
                    {colProjects.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {colProjects.map(project => {
                    const summary = paymentSummary(project.payments)
                    const isDragging = dragId === project.id
                    const isMoving = movingIds.has(project.id)

                    return (
                      <div
                        key={project.id}
                        draggable={!isMoving}
                        onDragStart={() => setDragId(project.id)}
                        onDragEnd={() => { setDragId(null); setOverColumn(null) }}
                        style={{
                          background: 'var(--theme-elevation-100,#131313)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 6,
                          padding: '0.7rem 0.8rem',
                          cursor: isMoving ? 'wait' : 'grab',
                          opacity: isDragging || isMoving ? 0.5 : 1,
                          transition: 'opacity 0.12s',
                        }}
                      >
                        <Link
                          href={`/admin/collections/projects/${project.id}`}
                          draggable={false}
                          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                        >
                          <p style={{ margin: '0 0 0.15rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--theme-text,#e6e1de)' }}>
                            {project.clientName}
                          </p>
                          <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', color: 'var(--theme-text-dim,#9b9a9a)' }}>
                            {project.projectType ? TYPE_LABELS[project.projectType] ?? project.projectType : 'No type set'}
                            {project.projectDate ? ` · ${fmtDate(project.projectDate)}` : ''}
                          </p>
                          {(summary.paid > 0 || summary.upcoming > 0 || summary.pastDue > 0) && (
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {summary.paid > 0 && (
                                <span style={{ fontSize: '0.65rem', color: '#7ed99a', background: 'rgba(126,217,154,0.1)', borderRadius: 3, padding: '0.05rem 0.35rem' }}>
                                  Paid {fmtAmount(summary.paid)}
                                </span>
                              )}
                              {summary.upcoming > 0 && (
                                <span style={{ fontSize: '0.65rem', color: '#9b9a9a', background: 'rgba(155,154,154,0.1)', borderRadius: 3, padding: '0.05rem 0.35rem' }}>
                                  Upcoming {fmtAmount(summary.upcoming)}
                                </span>
                              )}
                              {summary.pastDue > 0 && (
                                <span style={{ fontSize: '0.65rem', color: '#f0a3a3', background: 'rgba(240,163,163,0.1)', borderRadius: 3, padding: '0.05rem 0.35rem' }}>
                                  Past Due {fmtAmount(summary.pastDue)}
                                </span>
                              )}
                            </div>
                          )}
                        </Link>
                      </div>
                    )
                  })}
                </div>

                <Link
                  href={`/admin/collections/projects/create`}
                  style={{
                    display: 'block', marginTop: '0.6rem', padding: '0.4rem 0.5rem',
                    fontSize: '0.75rem', color: 'var(--theme-text-dim,#9b9a9a)',
                    textDecoration: 'none', borderRadius: 4, textAlign: 'center',
                    border: '1px dashed rgba(255,255,255,0.12)',
                  }}
                >
                  + Add Project
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
