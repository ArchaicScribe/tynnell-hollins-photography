'use client'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Favorites } from './useFavorites'
import styles from './favorites.module.css'

// The pieces of client favorites (TYN-13) drawn on the gallery page: the
// heart on each photo, the bar above the grid, and the name/email prompt.

type HeartProps = {
  favorites: Favorites
  photoId: number
  // 1-based position, so each heart has its own name for screen readers.
  position: number
  variant?: 'tile' | 'lightbox'
}

export function FavoriteHeart({ favorites, photoId, position, variant = 'tile' }: HeartProps) {
  const on = favorites.isFavorite(photoId)
  const blocked = !on && favorites.atLimit
  return (
    <button
      type="button"
      className={`${styles.heart} ${variant === 'lightbox' ? styles.heartLightbox : styles.heartTile}${on ? ` ${styles.heartOn}` : ''}`}
      aria-pressed={on}
      aria-label={on
        ? `Remove photo ${position} from favorites`
        : `Add photo ${position} to favorites${blocked ? ` (limit of ${favorites.limit} reached)` : ''}`}
      title={blocked ? `You've chosen your ${favorites.limit} favorites. Remove one to add another.` : undefined}
      // aria-disabled, not disabled: a disabled button cannot be focused, so
      // keyboard and screen reader users would never learn why it is off.
      aria-disabled={blocked || undefined}
      onClick={e => { e.stopPropagation(); if (!blocked) favorites.toggle(photoId) }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" />
      </svg>
    </button>
  )
}

type BarProps = {
  favorites: Favorites
  onlyFavorites: boolean
  onToggleOnlyFavorites: () => void
}

function sentOn(iso: string): string {
  const date = new Date(iso)
  return isNaN(date.getTime()) ? '' : ` on ${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`
}

export function FavoritesBar({ favorites, onlyFavorites, onToggleOnlyFavorites }: BarProps) {
  const { list, count, limit } = favorites
  const total = limit ? `${count} of ${limit} favorites` : `${count} ${count === 1 ? 'favorite' : 'favorites'}`

  return (
    <div className={styles.bar}>
      {!list ? (
        <p className={styles.hint}>Tap the heart on any photo to choose your favorites.</p>
      ) : (
        <>
          <div className={styles.barInfo}>
            <p className={styles.count}>{total}</p>
            <p className={styles.who}>
              Choosing as {list.name || list.email}.{' '}
              <button type="button" className={styles.linkBtn} onClick={() => { void favorites.leave() }}>Not you?</button>
            </p>
          </div>
          <div className={styles.barActions}>
            {(count > 0 || onlyFavorites) && (
              <button type="button" className={styles.btn} aria-pressed={onlyFavorites} onClick={onToggleOnlyFavorites}>
                {onlyFavorites ? 'Show all photos' : 'Show favorites'}
              </button>
            )}
            {list.unsentChanges && (
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={favorites.sending} onClick={() => { void favorites.send() }}>
                {favorites.sending ? 'Sending...' : list.sentAt ? 'Send update to Tynnell' : 'Send to Tynnell'}
              </button>
            )}
            {list.sentAt && !list.unsentChanges && (
              <p className={styles.sent} role="status">Sent to Tynnell{sentOn(list.sentAt)}</p>
            )}
          </div>
        </>
      )}
      {favorites.error && <p className={styles.error} role="alert">{favorites.error}</p>}
    </div>
  )
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled])'

export function FavoritesSignIn({ favorites }: { favorites: Favorites }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const cameFrom = useRef<HTMLElement | null>(null)

  useEffect(() => {
    cameFrom.current = document.activeElement as HTMLElement | null
    nameRef.current?.focus()
    return () => { cameFrom.current?.focus() }
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!name.trim() || !email.trim()) { setError('Please enter your name and email.'); return }
    setBusy(true)
    setError('')
    const problem = await favorites.start(name.trim(), email.trim())
    // On success the hook closes this prompt, so only a failure is handled.
    if (problem) { setError(problem); setBusy(false) }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); favorites.cancelAsking(); return }
    if (e.key !== 'Tab' || !dialogRef.current) return
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  return (
    <div className={styles.scrim} onClick={favorites.cancelAsking}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-signin-title"
        className={styles.dialog}
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <h2 id="favorites-signin-title" className={styles.dialogTitle}>Choose your favorites</h2>
        <p className={styles.dialogText}>
          Tell us who is choosing, so Tynnell knows whose picks these are. Use the same email on any device to come back to your list.
        </p>
        <form onSubmit={submit} noValidate>
          <label className={styles.field}>
            <span>Your name</span>
            <input ref={nameRef} type="text" value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={100} />
          </label>
          <label className={styles.field}>
            <span>Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" maxLength={255} />
          </label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.dialogActions}>
            <button type="button" className={styles.btn} onClick={favorites.cancelAsking}>Cancel</button>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy}>
              {busy ? 'Starting...' : 'Start choosing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
