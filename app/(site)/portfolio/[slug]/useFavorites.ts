'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ClientFavorites } from '@/app/lib/favoritesRequest'

// Client side of gallery favorites (TYN-13). Talks to /api/favorites/*; the
// server keeps the list and ties this browser to it with an httpOnly cookie,
// so nothing here knows a list id.

type ServerState = { list: ClientFavorites | null; limit: number | null }

const GENERIC_ERROR = 'Something went wrong. Please try again.'

async function call(path: string, method: 'GET' | 'POST' | 'DELETE', body?: unknown) {
  const res = await fetch(path, {
    method,
    ...(body !== undefined && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data: data as ServerState & { error?: string } }
}

export type Favorites = ReturnType<typeof useFavorites>

// Pass null for a gallery that does not have favorites turned on: the hook
// then does nothing and `enabled` is false.
export function useFavorites(slug: string | null) {
  const [list, setList] = useState<ClientFavorites | null>(null)
  const [limit, setLimit] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  // The photo whose heart was pressed before the client had a list; it is
  // saved as soon as they have given their name and email.
  const [askingFor, setAskingFor] = useState<number | null>(null)

  // Saves run one at a time, in the order the hearts were pressed.
  const queue = useRef<Promise<void>>(Promise.resolve())
  const waiting = useRef(0)

  const adopt = useCallback((data: ServerState) => {
    setList(data.list ?? null)
    setLimit(data.limit ?? null)
  }, [])

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    call(`/api/favorites?gallery=${encodeURIComponent(slug)}`, 'GET')
      .then(({ ok, data }) => { if (ok && !cancelled) adopt(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [slug, adopt])

  const save = useCallback((photoId: number, favorited: boolean) => {
    if (!slug) return
    setError('')
    const apply = (on: boolean) => setList(l => l && {
      ...l,
      photoIds: on ? [...l.photoIds.filter(id => id !== photoId), photoId] : l.photoIds.filter(id => id !== photoId),
    })
    apply(favorited)
    waiting.current++
    queue.current = queue.current.then(async () => {
      let result: Awaited<ReturnType<typeof call>> | null = null
      try {
        result = await call('/api/favorites/toggle', 'POST', { gallery: slug, photoId, favorited })
      } catch {
        // Offline, or the request never got there: handled below.
      }
      waiting.current--
      if (result?.ok) {
        // Only take the server's answer once nothing newer is on its way,
        // or a quick second heart would flicker off and on.
        if (waiting.current === 0) adopt(result.data)
      } else {
        apply(!favorited)
        setError(result?.data.error ?? GENERIC_ERROR)
      }
    })
  }, [slug, adopt])

  // A wedding gallery can hold hundreds of photos, each asking this on
  // every render.
  const chosen = useMemo(() => new Set(list?.photoIds), [list])
  const isFavorite = useCallback((photoId: number) => chosen.has(photoId), [chosen])
  const count = list?.photoIds.length ?? 0
  const atLimit = Boolean(limit && count >= limit)

  const toggle = useCallback((photoId: number) => {
    if (!list) { setAskingFor(photoId); return }
    const favorited = !list.photoIds.includes(photoId)
    if (favorited && limit && list.photoIds.length >= limit) return
    save(photoId, favorited)
  }, [list, limit, save])

  // Returns an error message, or null when the list is ready.
  const start = useCallback(async (name: string, email: string): Promise<string | null> => {
    if (!slug) return GENERIC_ERROR
    try {
      const { ok, data } = await call('/api/favorites/start', 'POST', { gallery: slug, name, email })
      if (!ok || !data.list) return data.error ?? GENERIC_ERROR
      adopt(data)
      const pending = askingFor
      setAskingFor(null)
      // A returning client may already have this photo: never flip it off.
      const full = Boolean(data.limit && data.list.photoIds.length >= data.limit)
      if (pending !== null && !data.list.photoIds.includes(pending) && !full) save(pending, true)
      return null
    } catch {
      return GENERIC_ERROR
    }
  }, [slug, askingFor, adopt, save])

  const send = useCallback(async () => {
    if (!slug || sending) return
    setSending(true)
    setError('')
    try {
      // Let any heart still being saved land first, so it is in the email.
      await queue.current
      const { ok, data } = await call('/api/favorites/send', 'POST', { gallery: slug })
      if (ok) adopt(data)
      else setError(data.error ?? GENERIC_ERROR)
    } catch {
      setError(GENERIC_ERROR)
    }
    setSending(false)
  }, [slug, sending, adopt])

  const leave = useCallback(async () => {
    if (!slug) return
    setError('')
    try {
      await queue.current
      const { ok } = await call(`/api/favorites?gallery=${encodeURIComponent(slug)}`, 'DELETE')
      if (ok) setList(null)
      else setError(GENERIC_ERROR)
    } catch {
      setError(GENERIC_ERROR)
    }
  }, [slug])

  return {
    enabled: slug !== null,
    list,
    limit,
    count,
    atLimit,
    error,
    sending,
    askingFor,
    cancelAsking: () => setAskingFor(null),
    isFavorite,
    toggle,
    start,
    send,
    leave,
  }
}
