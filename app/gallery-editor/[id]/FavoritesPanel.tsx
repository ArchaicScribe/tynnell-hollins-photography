'use client'
import { useEffect, useState } from 'react'
import { fileNameForSearch } from '@/app/lib/photoFileName'

// Gallery editor's Favorites tab (TYN-13): each client's hearted photos for
// this gallery, read from /api/galleries/[id]/favorites. Inline styles match
// the rest of the gallery editor sidebar.

export type FavoritesPanelList = {
  id: number
  clientName: string
  clientEmail: string
  photoIds: number[]
  sentAt: string | null
  unsentChanges: boolean
  updatedAt: string
}

type PanelPhoto = { id: number; thumbUrl: string | null; filename: string | null; originalFilename?: string | null }

type Props = {
  galleryId: number
  // Whether client favorites are turned on for this gallery.
  enabled: boolean
  // The gallery's photos, used to draw each list's thumbnails.
  photos: PanelPhoto[]
  // A list to open straight away (the link in Tynnell's email).
  openListId?: number | null
}

const ui = 'var(--font-heading, Archivo, sans-serif)'
const muted: React.CSSProperties = { fontSize: '0.72rem', color: '#6b6a6a', fontFamily: ui, margin: 0, lineHeight: 1.5 }
const smallBtn: React.CSSProperties = { background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#9b9a9a', borderRadius: 6, padding: '0.4rem 0.6rem', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer', fontFamily: ui }

function shortDate(iso: string): string {
  const date = new Date(iso)
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function status(list: FavoritesPanelList): string {
  if (!list.sentAt) return 'Not sent yet'
  return list.unsentChanges ? `Changed since sent ${shortDate(list.sentAt)}` : `Sent ${shortDate(list.sentAt)}`
}

export function FavoritesPanel({ galleryId, enabled, photos, openListId = null }: Props) {
  const [lists, setLists] = useState<FavoritesPanelList[] | null>(null)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState<number | null>(openListId)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/galleries/${galleryId}/favorites`, { credentials: 'include' })
      .then(async res => {
        if (!res.ok) throw new Error(String(res.status))
        const data = (await res.json()) as { lists?: FavoritesPanelList[] }
        if (!cancelled) setLists(data.lists ?? [])
      })
      .catch(() => { if (!cancelled) setError('Could not load favorites. Please try again.') })
    return () => { cancelled = true }
  }, [galleryId])

  const byId = new Map(photos.map(p => [p.id, p]))
  // The name as exported, so a Lightroom search matches; the stored filename
  // has Payload's de-dup suffix ("smith-1.jpg") when a name was uploaded twice.
  const fileName = (id: number) => {
    const photo = byId.get(id)
    return (photo && fileNameForSearch(photo)) ?? `Photo ${id}`
  }

  const copyNames = async (list: FavoritesPanelList) => {
    try {
      await navigator.clipboard.writeText(list.photoIds.map(fileName).join(', '))
      setCopiedId(list.id)
    } catch {
      setError('Could not copy. Please try again.')
    }
  }

  const remove = async (list: FavoritesPanelList) => {
    if (!window.confirm(`Delete ${list.clientName || list.clientEmail}'s favorites list? This cannot be undone.`)) return
    setError('')
    try {
      const res = await fetch(`/api/galleries/${galleryId}/favorites?list=${list.id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error(String(res.status))
      setLists(prev => prev?.filter(l => l.id !== list.id) ?? null)
    } catch {
      setError('Could not delete the list. Please try again.')
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {!enabled && (
        <p style={muted}>Client favorites are turned off for this gallery. Turn them on in Settings to let clients heart photos.</p>
      )}
      {error && <p role="alert" style={{ ...muted, color: '#e07a7a' }}>{error}</p>}
      {lists === null && !error && <p style={muted}>Loading...</p>}
      {lists?.length === 0 && <p style={muted}>No one has chosen favorites yet.</p>}

      {lists?.map(list => {
        const open = openId === list.id
        const name = list.clientName || list.clientEmail
        const count = `${list.photoIds.length} ${list.photoIds.length === 1 ? 'photo' : 'photos'}`
        const headingId = `favorites-list-${list.id}`
        return (
          <div key={list.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, background: '#141414' }}>
            <button
              type="button"
              id={headingId}
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : list.id)}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '0.7rem 0.75rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.2rem', fontFamily: ui }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d6d1ce' }}>{name}</span>
              <span style={{ fontSize: '0.7rem', color: '#6b6a6a' }}>{count} &middot; {status(list)}</span>
            </button>

            {open && (
              <div role="region" aria-labelledby={headingId} style={{ padding: '0 0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <a href={`mailto:${list.clientEmail}`} style={{ fontSize: '0.72rem', color: '#9b9a9a', fontFamily: ui, wordBreak: 'break-all' }}>{list.clientEmail}</a>
                {list.photoIds.length === 0 ? (
                  <p style={muted}>No photos chosen yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                    {list.photoIds.map(id => {
                      const photo = byId.get(id)
                      return photo?.thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={id} src={photo.thumbUrl} alt={fileName(id)} title={fileName(id)} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', borderRadius: 3 }} />
                      ) : (
                        <div key={id} style={{ aspectRatio: '1', background: '#1a1a1a', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b4b4b', fontSize: '0.55rem', fontFamily: ui, padding: 2, textAlign: 'center', wordBreak: 'break-all' }}>{fileName(id)}</div>
                      )
                    })}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {list.photoIds.length > 0 && (
                    <button type="button" style={smallBtn} onClick={() => void copyNames(list)}>
                      {copiedId === list.id ? 'Copied' : 'Copy file names'}
                    </button>
                  )}
                  <button type="button" style={{ ...smallBtn, color: '#e07a7a', borderColor: 'rgba(224,122,122,0.3)' }} onClick={() => void remove(list)}>
                    Delete list
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
