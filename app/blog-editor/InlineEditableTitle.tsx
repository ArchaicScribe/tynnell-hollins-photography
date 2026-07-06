'use client'

import { useEffect, useRef, useState } from 'react'

// Click the real rendered <h1> to edit it in place. Not real contentEditable -
// Tangerine's variable script-font metrics make caret positioning unreliable
// there, so this overlays a plain <input> styled to match .title exactly
// while editing, and swaps back to the real heading otherwise.
export function InlineEditableTitle({
  value,
  onCommit,
  className,
  style,
}: {
  value: string
  onCommit: (next: string) => void
  className?: string
  style?: React.CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(value) }, [value])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commit = () => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onCommit(trimmed)
    else setDraft(value)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); commit() }
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        aria-label="Post title"
        className={className}
        style={{
          ...style,
          background: 'transparent',
          border: 'none',
          borderBottom: '1px dashed rgba(255,255,255,0.4)',
          outline: 'none',
          width: '100%',
          padding: 0,
          fontFamily: 'inherit',
          color: 'inherit',
        }}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={className}
      style={{
        ...style,
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        textAlign: 'inherit',
        cursor: 'text',
        font: 'inherit',
        color: 'inherit',
        display: 'block',
        width: '100%',
      }}
    >
      {value || 'Untitled Post'}
    </button>
  )
}
