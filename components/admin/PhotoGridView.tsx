'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type PhotoDoc = {
  id: number
  filename: string
  title?: string | null
  category?: string | null
  featured?: boolean | null
  url?: string | null
  sizes?: {
    thumbnail?: { url?: string | null } | null
    card?: { url?: string | null } | null
  } | null
}

// Gallery membership lookup: photoId -> array of gallery titles
// Fetched once on mount from /api/galleries (depth=0 so photo is just an ID)
type GalleryDoc = {
  id: number
  title: string
  photos?: { photo?: number | null; id?: string | null }[] | null
}

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; current: number; total: number; errors: string[] }
  | { status: 'done'; uploaded: number; errors: string[] }

// Trash icon SVG (16x16, inline so no external dependency)
function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <path d="M2 4h12M6 4V2h4v2M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4H5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const css = {
  root: {
    padding: '1.5rem',
    fontFamily: 'var(--font-body, system-ui, sans-serif)',
    color: 'var(--theme-text, #e6e1de)',
    minHeight: '100vh',
  } as React.CSSProperties,
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  search: {
    flex: '1 1 220px',
    minWidth: '160px',
    padding: '0.5rem 0.75rem',
    background: 'var(--theme-elevation-100, #131313)',
    border: '1px solid var(--theme-elevation-300, #2a2a2a)',
    borderRadius: '4px',
    color: 'var(--theme-text, #e6e1de)',
    fontSize: '0.875rem',
    outline: 'none',
  } as React.CSSProperties,
  uploadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.5rem 1rem',
    background: 'var(--theme-success-500, #10B981)',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    border: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  count: {
    fontSize: '0.8rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  dropzone: (dragging: boolean): React.CSSProperties => ({
    border: `2px dashed ${dragging ? '#10B981' : 'rgba(214,209,206,0.15)'}`,
    borderRadius: '6px',
    padding: '1.5rem 1rem',
    textAlign: 'center',
    marginBottom: '1.25rem',
    background: dragging ? 'rgba(16,185,129,0.05)' : 'transparent',
    transition: 'border-color 0.15s, background 0.15s',
    cursor: 'pointer',
  }),
  dropzoneText: {
    fontSize: '0.8rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    pointerEvents: 'none' as const,
    lineHeight: 1.6,
  } as React.CSSProperties,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  progressBar: (_pct: number): React.CSSProperties => ({
    height: '4px',
    borderRadius: '2px',
    background: 'var(--theme-elevation-300, #2a2a2a)',
    overflow: 'hidden',
    marginBottom: '0.5rem',
    position: 'relative',
  }),
  progressFill: (pct: number): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${pct}%`,
    background: '#10B981',
    borderRadius: '2px',
    transition: 'width 0.2s',
  }),
  progressLabel: {
    fontSize: '0.75rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    textAlign: 'center' as const,
    marginBottom: '1rem',
  } as React.CSSProperties,
  doneBar: {
    fontSize: '0.78rem',
    color: '#10B981',
    textAlign: 'center' as const,
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,
  errorList: {
    marginBottom: '1rem',
    padding: '0.75rem 1rem',
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.25)',
    borderRadius: '4px',
    fontSize: '0.72rem',
    color: '#f87171',
    lineHeight: 1.7,
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '0.875rem',
  } as React.CSSProperties,
  card: {
    background: 'var(--theme-elevation-100, #131313)',
    borderRadius: '6px',
    overflow: 'hidden',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    border: '1px solid var(--theme-elevation-200, #1a1a1a)',
    transition: 'border-color 0.15s, transform 0.15s',
  } as React.CSSProperties,
  imgWrap: {
    width: '100%',
    paddingBottom: '75%',
    position: 'relative' as const,
    background: 'var(--theme-elevation-200, #1a1a1a)',
    overflow: 'hidden',
  } as React.CSSProperties,
  img: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  } as React.CSSProperties,
  placeholder: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    color: 'var(--theme-elevation-400, #3a3a3a)',
  } as React.CSSProperties,
  cardBody: {
    padding: '0.5rem 0.625rem',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '0.75rem',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    color: 'var(--theme-text, #e6e1de)',
    marginBottom: '0.2rem',
  } as React.CSSProperties,
  cardMeta: {
    fontSize: '0.7rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    textTransform: 'capitalize' as const,
  } as React.CSSProperties,
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '2rem',
  } as React.CSSProperties,
  pageBtn: {
    padding: '0.375rem 0.75rem',
    background: 'var(--theme-elevation-100, #131313)',
    border: '1px solid var(--theme-elevation-300, #2a2a2a)',
    borderRadius: '4px',
    color: 'var(--theme-text, #e6e1de)',
    fontSize: '0.8rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  pageBtnActive: {
    background: 'var(--theme-success-500, #10B981)',
    borderColor: 'var(--theme-success-500, #10B981)',
    color: '#fff',
    fontWeight: 600,
  } as React.CSSProperties,
  pageBtnDisabled: {
    opacity: 0.4,
    cursor: 'default',
    pointerEvents: 'none' as const,
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: '4rem 2rem',
    color: 'var(--theme-text-dim, #9b9a9a)',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  galleryBadges: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.2rem',
    marginTop: '0.3rem',
  } as React.CSSProperties,
  galleryBadge: {
    padding: '0.1rem 0.35rem',
    background: 'rgba(155,154,154,0.12)',
    border: '1px solid rgba(155,154,154,0.2)',
    borderRadius: '3px',
    fontSize: '0.58rem',
    letterSpacing: '0.04em',
    color: 'var(--theme-text-dim, #9b9a9a)',
    whiteSpace: 'nowrap' as const,
    lineHeight: 1.5,
  } as React.CSSProperties,
  galleryBadgeMore: {
    padding: '0.1rem 0.35rem',
    fontSize: '0.58rem',
    color: 'rgba(155,154,154,0.6)',
    lineHeight: 1.5,
  } as React.CSSProperties,
  skeleton: {
    background: 'var(--theme-elevation-200, #1a1a1a)',
    borderRadius: '6px',
    paddingBottom: '75%',
    position: 'relative' as const,
    animation: 'pulse 1.5s infinite',
  } as React.CSSProperties,
}

const CATEGORIES = ['weddings', 'portraits', 'families', 'couples', 'brands']

const filterBtn = (active: boolean): React.CSSProperties => ({
  padding: '0.3rem 0.7rem',
  background: active ? 'var(--theme-elevation-500, #9B9A9A)' : 'var(--theme-elevation-100, #131313)',
  border: `1px solid ${active ? 'transparent' : 'var(--theme-elevation-300, #2a2a2a)'}`,
  borderRadius: '20px',
  color: active ? '#fff' : 'var(--theme-text-dim, #9b9a9a)',
  fontSize: '0.68rem',
  letterSpacing: '0.08em',
  textTransform: 'capitalize',
  cursor: 'pointer',
  fontWeight: active ? 600 : 400,
  whiteSpace: 'nowrap',
})

const LIMIT = 48

// Extensions that sharp cannot process on Vercel (no native libheif/libbmp).
// Caught before the first network request so the error message is instant and clear.
const UNSUPPORTED_EXTS = new Set(['heic', 'heif', 'avif', 'tiff', 'tif', 'bmp'])

function getFileExt(filename: string): string {
  return (filename.split('.').pop() ?? '').toLowerCase()
}

// Three-step upload to bypass Vercel's 4.5 MB serverless request body limit:
//   1. Get a presigned R2 PUT URL from our API (tiny JSON request)
//   2. PUT the file directly to R2 from the browser (no Vercel in the path)
//   3. Call /api/photos/ingest so the server downloads, runs sharp, and
//      creates the Payload record (no large request body - key only)
async function uploadFile(file: File, category: string | null): Promise<void> {
  // Pre-flight: reject unsupported formats before any network traffic.
  // HEIC (iPhone default) and HEIF require native libheif which Vercel does not provide.
  const ext = getFileExt(file.name)
  if (UNSUPPORTED_EXTS.has(ext)) {
    throw new Error(
      `${file.name} - ${ext.toUpperCase()} files are not supported. Open the photo on your phone, export or share it as JPEG, then upload the JPEG version.`
    )
  }

  // Step 1: request a presigned URL
  const presignRes = await fetch('/api/upload-presign', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'image/jpeg',
    }),
  })
  if (!presignRes.ok) {
    let errMsg = presignRes.statusText
    try {
      const json = await presignRes.json()
      if (json?.error) errMsg = json.error
    } catch { /* fall through to statusText */ }
    throw new Error(`${file.name} - ${errMsg}`)
  }
  const { uploadUrl, key } = (await presignRes.json()) as { uploadUrl: string; key: string }

  // Step 2: PUT directly to R2 (browser talks to Cloudflare, skips Vercel entirely)
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'image/jpeg' },
  })
  if (!putRes.ok) {
    throw new Error(`${file.name} - upload to storage failed (HTTP ${putRes.status}). Check your connection and try again.`)
  }

  // Step 3: ingest - server downloads the file, runs sharp, creates Payload record.
  // The active category filter is passed here so the photo is tagged correctly;
  // without this, photos dragged in on the Weddings tab would have no category set.
  const ingestRes = await fetch('/api/photos/ingest', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, filename: file.name, category: category ?? null }),
  })
  if (!ingestRes.ok) {
    let errMsg = `HTTP ${ingestRes.status}`
    try {
      const json = await ingestRes.json()
      if (json?.error) errMsg = json.error
    } catch { /* fall through to status code */ }
    throw new Error(`${file.name} - ${errMsg}`)
  }
}

export function PhotoGridView() {
  const [photos, setPhotos] = useState<PhotoDoc[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' })
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const refreshRef = useRef<() => void>(() => {})
  // Map of photoId -> gallery title array, built once on mount
  const [galleryMap, setGalleryMap] = useState<Record<number, string[]>>({})
  // IDs currently being toggled (prevents double-clicks and shows wait cursor)
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set())
  // ID showing the inline delete confirmation overlay (null = none)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  // IDs currently being deleted (shows loading state)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

  const deletePhoto = useCallback(async (id: number) => {
    setDeletingIds(prev => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/photos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.id !== id))
        setTotal(n => n - 1)
      }
    } finally {
      setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next })
      setConfirmDeleteId(null)
    }
  }, [])

  const toggleFeatured = useCallback(async (e: React.MouseEvent, photo: PhotoDoc) => {
    e.preventDefault()
    e.stopPropagation()
    if (togglingIds.has(photo.id)) return
    setTogglingIds(prev => new Set([...prev, photo.id]))
    try {
      const res = await fetch(`/api/photos/${photo.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !photo.featured }),
      })
      if (res.ok) {
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, featured: !p.featured } : p))
      }
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev)
        next.delete(photo.id)
        return next
      })
    }
  }, [togglingIds])

  const fetchPhotos = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({
      limit: String(LIMIT),
      page: String(page),
      depth: '0',
      sort: '-createdAt',
    })
    if (debouncedSearch) {
      params.append('where[or][0][title][contains]', debouncedSearch)
      params.append('where[or][1][filename][contains]', debouncedSearch)
    }
    if (category) {
      params.append('where[category][equals]', category)
    }
    if (featuredOnly) {
      params.append('where[featured][equals]', 'true')
    }

    fetch(`/api/photos?${params.toString()}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setPhotos(data.docs ?? [])
        setTotal(data.totalDocs ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [debouncedSearch, category, featuredOnly, page])

  // Keep a ref so upload callback can trigger a refresh without stale closure
  useEffect(() => {
    refreshRef.current = fetchPhotos
  }, [fetchPhotos])

  // Fetch all galleries once on mount to build photo-to-gallery membership map.
  // Uses depth=0 so each photo row's .photo field is just the numeric ID.
  useEffect(() => {
    fetch('/api/galleries?limit=300&depth=0', { credentials: 'include' })
      .then(r => r.json())
      .then((data: { docs?: GalleryDoc[] }) => {
        const map: Record<number, string[]> = {}
        for (const gallery of data.docs ?? []) {
          for (const row of gallery.photos ?? []) {
            const pid = typeof row.photo === 'number' ? row.photo : null
            if (pid !== null) {
              if (!map[pid]) map[pid] = []
              map[pid].push(gallery.title)
            }
          }
        }
        setGalleryMap(map)
      })
      .catch(() => { /* non-critical -- badges just won't show */ })
  }, [])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [search])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    const errors: string[] = []
    setUploadState({ status: 'uploading', current: 0, total: imageFiles.length, errors: [] })

    for (let i = 0; i < imageFiles.length; i++) {
      setUploadState({ status: 'uploading', current: i + 1, total: imageFiles.length, errors })
      try {
        await uploadFile(imageFiles[i], category)
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err))
      }
    }

    setUploadState({ status: 'done', uploaded: imageFiles.length - errors.length, errors })
    refreshRef.current()

    // Auto-dismiss the "done" banner after 4s if no errors
    if (errors.length === 0) {
      setTimeout(() => setUploadState({ status: 'idle' }), 4000)
    }
  }, [category])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
      e.target.value = ''
    }
  }, [handleFiles])

  const skeletonCount = 24
  const uploadPct =
    uploadState.status === 'uploading'
      ? Math.round((uploadState.current / uploadState.total) * 100)
      : 0

  return (
    <div style={css.root}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .photo-card:hover {
          border-color: var(--theme-elevation-400, #3a3a3a) !important;
          transform: translateY(-2px);
        }
      `}</style>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={onFileInputChange}
      />

      {/* Toolbar */}
      <div style={css.toolbar}>
        <input
          type="search"
          placeholder="Search by name or filename..."
          aria-label="Search photos"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={css.search}
        />
        {!loading && (
          <span style={css.count}>
            {total} photo{total !== 1 ? 's' : ''}
          </span>
        )}
        <button
          style={{
            ...css.uploadBtn,
            opacity: uploadState.status === 'uploading' ? 0.6 : 1,
            cursor: uploadState.status === 'uploading' ? 'not-allowed' : 'pointer',
          }}
          onClick={() => uploadState.status !== 'uploading' && fileInputRef.current?.click()}
          disabled={uploadState.status === 'uploading'}
        >
          {uploadState.status === 'uploading'
            ? `Uploading ${uploadState.current} / ${uploadState.total}...`
            : '+ Upload Photos'}
        </button>
      </div>

      {/* Category + featured filter pills */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.875rem', alignItems: 'center' }}>
        <button style={filterBtn(category === null && !featuredOnly)} onClick={() => { setCategory(null); setFeaturedOnly(false); setPage(1) }}>
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            style={filterBtn(category === cat)}
            onClick={() => { setCategory(cat); setFeaturedOnly(false); setPage(1) }}
          >
            {cat}
          </button>
        ))}
        <span style={{ width: '1px', height: '16px', background: 'rgba(214,209,206,0.1)', margin: '0 0.25rem', display: 'inline-block', flexShrink: 0 }} />
        <button
          style={{
            ...filterBtn(featuredOnly),
            borderColor: featuredOnly ? 'transparent' : 'rgba(212,175,55,0.35)',
            color: featuredOnly ? '#fff' : 'rgba(212,175,55,0.8)',
            background: featuredOnly ? 'rgba(212,175,55,0.25)' : 'transparent',
          }}
          onClick={() => { setFeaturedOnly(f => !f); setPage(1) }}
          title="Show only photos featured on the homepage"
        >
          Featured
        </button>
      </div>

      {/* Drop zone */}
      <div
        style={css.dropzone(dragging)}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => uploadState.status !== 'uploading' && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload photos by dragging or clicking"
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
      >
        <div style={css.dropzoneText}>
          {dragging ? (
            <strong style={{ color: '#10B981' }}>Drop to upload</strong>
          ) : (
            <>
              <strong>Drag photos here</strong> to bulk upload, or click to browse.
              <br />
              <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                Select as many files as you like. Title and alt text are filled in automatically.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Upload progress */}
      {uploadState.status === 'uploading' && (
        <>
          <div style={css.progressBar(uploadPct)}>
            <div style={css.progressFill(uploadPct)} />
          </div>
          <div style={css.progressLabel}>
            Uploading {uploadState.current} of {uploadState.total}...
          </div>
        </>
      )}

      {/* Done banner */}
      {uploadState.status === 'done' && (
        <>
          {uploadState.uploaded > 0 && (
            <div style={css.doneBar}>
              <span>&#10003;</span>
              {uploadState.uploaded} photo{uploadState.uploaded !== 1 ? 's' : ''} uploaded
              {uploadState.errors.length > 0 && ` (${uploadState.errors.length} failed)`}
              <button
                style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: '#9b9a9a', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setUploadState({ status: 'idle' })}
              >
                Dismiss
              </button>
            </div>
          )}
          {uploadState.errors.length > 0 && (
            <div style={css.errorList}>
              <strong>Upload errors:</strong>
              {uploadState.errors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Grid */}
      {loading ? (
        <div style={css.grid}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} style={css.skeleton} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div style={css.empty}>
          {debouncedSearch || category
            ? 'No photos match your filters.'
            : 'No photos yet. Drag images onto the zone above to get started.'}
        </div>
      ) : (
        <div style={css.grid}>
          {photos.map(photo => {
            const thumbUrl = photo.sizes?.thumbnail?.url ?? photo.sizes?.card?.url ?? photo.url
            const label = photo.title ?? photo.filename
            return (
              <Link
                key={photo.id}
                href={`/admin/collections/photos/${photo.id}`}
                style={css.card}
                className="photo-card"
                title={label}
              >
                <div style={css.imgWrap}>
                  {thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbUrl} alt={label} style={css.img} loading="lazy" />
                  ) : (
                    <div style={css.placeholder}>&#128247;</div>
                  )}
                  {/* Featured quick-toggle star button */}
                  <button
                    type="button"
                    onClick={(e) => { void toggleFeatured(e, photo) }}
                    title={photo.featured ? 'Featured - click to unfeature' : 'Click to feature this photo'}
                    aria-label={photo.featured ? 'Remove from featured' : 'Add to featured'}
                    aria-pressed={photo.featured ?? false}
                    style={{
                      position: 'absolute',
                      top: '0.35rem',
                      right: '0.35rem',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: 'none',
                      background: photo.featured ? 'rgba(212,175,55,0.88)' : 'rgba(0,0,0,0.45)',
                      color: photo.featured ? '#0c0c0c' : 'rgba(255,255,255,0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: togglingIds.has(photo.id) ? 'wait' : 'pointer',
                      fontSize: '0.72rem',
                      opacity: togglingIds.has(photo.id) ? 0.5 : 1,
                      transition: 'background 0.15s, color 0.15s',
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    &#9733;
                  </button>
                  {/* Trash / delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setConfirmDeleteId(photo.id)
                    }}
                    title="Delete this photo"
                    aria-label="Delete this photo"
                    style={{
                      position: 'absolute',
                      top: '0.35rem',
                      left: '0.35rem',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(0,0,0,0.45)',
                      color: 'rgba(255,255,255,0.55)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s',
                      padding: 0,
                    }}
                  >
                    <TrashIcon />
                  </button>
                  {/* Inline delete confirmation overlay */}
                  {confirmDeleteId === photo.id && (
                    <div
                      onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(12,12,12,0.88)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        zIndex: 10,
                        padding: '0.5rem',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#E6E1DE', textAlign: 'center', lineHeight: 1.4 }}>
                        Delete this photo?
                      </span>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); void deletePhoto(photo.id) }}
                          disabled={deletingIds.has(photo.id)}
                          style={{
                            padding: '0.25rem 0.6rem',
                            background: deletingIds.has(photo.id) ? 'rgba(220,38,38,0.4)' : 'rgba(220,38,38,0.8)',
                            border: 'none',
                            borderRadius: '3px',
                            color: '#fff',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            cursor: deletingIds.has(photo.id) ? 'wait' : 'pointer',
                          }}
                        >
                          {deletingIds.has(photo.id) ? 'Deleting...' : 'Delete'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(null) }}
                          disabled={deletingIds.has(photo.id)}
                          style={{
                            padding: '0.25rem 0.6rem',
                            background: 'rgba(155,154,154,0.2)',
                            border: '1px solid rgba(155,154,154,0.3)',
                            borderRadius: '3px',
                            color: '#9B9A9A',
                            fontSize: '0.68rem',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div style={css.cardBody}>
                  <div style={css.cardTitle}>{label}</div>
                  {photo.category && (
                    <div style={css.cardMeta}>{photo.category}</div>
                  )}
                  {(() => {
                    const galleries = galleryMap[photo.id]
                    if (!galleries || galleries.length === 0) return null
                    const visible = galleries.slice(0, 2)
                    const extra = galleries.length - visible.length
                    return (
                      <div style={css.galleryBadges}>
                        {visible.map(name => (
                          <span key={name} style={css.galleryBadge}>{name}</span>
                        ))}
                        {extra > 0 && (
                          <span style={css.galleryBadgeMore}>+{extra}</span>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div style={css.pagination}>
          <button
            style={{ ...css.pageBtn, ...(page === 1 ? css.pageBtnDisabled : {}) }}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
            <button
              key={i}
              style={{ ...css.pageBtn, ...(page === i + 1 ? css.pageBtnActive : {}) }}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          {totalPages > 10 && page > 10 && (
            <button style={{ ...css.pageBtn, ...css.pageBtnActive }}>{page}</button>
          )}
          <button
            style={{ ...css.pageBtn, ...(page === totalPages ? css.pageBtnDisabled : {}) }}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
