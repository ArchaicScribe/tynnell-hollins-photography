'use client'

import { usePuck } from '@measured/puck'

// TYN-328 (rebuilt to match the real Pixieset reference exactly, per screenshots
// of website.pixieset.com/pages/... - not just loose inspiration): floating
// toolbar top-RIGHT of the hovered section, "Change Layout" and "Open Editor"
// as two SEPARATE pill buttons (not one merged pill), then a connected icon
// pill: settings, duplicate, bookmark (save as template), share, trash, and a
// combined up/down reorder control - six icons, in that exact order.
//
// Puck's default action bar is suppressed entirely (see EditorClient.tsx's
// `actionBar: () => <></>`) since its Duplicate/Delete can't be relocated into
// a custom layout without rebuilding them anyway. `componentOverlay` is the
// only override that reliably identifies which block it's for
// (componentId/componentType - `actionBar` only gets a display label), so
// every action here is rebuilt on it using public usePuck() API:
// `getSelectorForId` for selection, and `setData` array edits (scoped to
// top-level content - this codebase has no nested slot/dropzone fields today)
// for duplicate/delete/reorder - deliberately avoiding Puck's private,
// unexported root-zone-id string.
//
// "Change Layout" only appears for blocks that actually have a layout picker
// (Hero/SplitImageText/PhotoGallery per TYN-329) and, like "Open Editor" and
// the settings-gear icon, just selects the block - the layout picker is the
// first field in each of those blocks, so selecting surfaces it immediately.
//
// Bookmark ("save as template") and share have no backing feature on this
// site (no template system, no section-sharing) - included for visual parity
// with the reference, rendered disabled with a title explaining why, rather
// than either a fake working button or a missing icon that breaks the layout.
export function SectionHoverToolbar({
  children,
  componentId,
  componentType,
  hover,
  isSelected,
}: {
  children: React.ReactNode
  componentId: string
  componentType: string
  hover: boolean
  isSelected: boolean
}) {
  const { appState, dispatch, config, getSelectorForId } = usePuck()
  const content = appState.data.content
  const index = content.findIndex((item) => item.props.id === componentId)
  const visible = (hover || isSelected) && index !== -1
  const hasLayout = Boolean(
    (config.components as Record<string, { fields?: Record<string, unknown> }>)[componentType]?.fields?.layout,
  )

  const select = () => {
    const selector = getSelectorForId(componentId)
    if (!selector) return
    dispatch({ type: 'setUi', ui: { itemSelector: selector } })
  }

  const duplicate = () => {
    if (index === -1) return
    const clone = structuredClone(content[index]) as (typeof content)[number]
    clone.props.id = `${componentType}-${crypto.randomUUID()}`
    dispatch({
      type: 'setData',
      data: (prev) => {
        const next = [...prev.content]
        next.splice(index + 1, 0, clone)
        return { ...prev, content: next }
      },
    })
  }

  const remove = () => {
    if (index === -1) return
    dispatch({
      type: 'setData',
      data: (prev) => ({ ...prev, content: prev.content.filter((item) => item.props.id !== componentId) }),
    })
  }

  const move = (direction: -1 | 1) => {
    const target = index + direction
    if (index === -1 || target < 0 || target >= content.length) return
    dispatch({
      type: 'setData',
      data: (prev) => {
        const next = [...prev.content]
        ;[next[index], next[target]] = [next[target], next[index]]
        return { ...prev, content: next }
      },
    })
  }

  return (
    <>
      {children}
      {visible && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 20,
            display: 'flex',
            gap: 8,
            pointerEvents: 'auto',
          }}
        >
          {hasLayout && (
            <button
              type="button"
              style={soloBtnStyle()}
              onClick={(e) => {
                e.stopPropagation()
                select()
              }}
            >
              Change Layout
            </button>
          )}
          <button
            type="button"
            style={soloBtnStyle()}
            onClick={(e) => {
              e.stopPropagation()
              select()
            }}
          >
            Open Editor
          </button>
          <div style={pillStyle()}>
            <IconButton title="Settings" onClick={select}>
              <GearIcon />
            </IconButton>
            <IconButton title="Duplicate" onClick={duplicate}>
              <CopyIcon />
            </IconButton>
            <IconButton title="Save as template - not available yet" disabled>
              <BookmarkIcon />
            </IconButton>
            <IconButton title="Share - not available yet" disabled>
              <ShareIcon />
            </IconButton>
            <IconButton title="Delete" onClick={remove}>
              <TrashIcon />
            </IconButton>
            <ReorderButton
              index={index}
              length={content.length}
              onUp={() => move(-1)}
              onDown={() => move(1)}
              last
            />
          </div>
        </div>
      )}
    </>
  )
}

function pillStyle(): React.CSSProperties {
  return {
    display: 'flex',
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
  }
}

function soloBtnStyle(): React.CSSProperties {
  return {
    padding: '8px 14px',
    background: '#1a1a1a',
    color: '#e6e1de',
    fontSize: 12.5,
    fontWeight: 500,
    fontFamily: "var(--font-body, 'Roboto Mono', monospace)",
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
  }
}

function IconButton({
  children,
  title,
  onClick,
  disabled,
  last,
}: {
  children: React.ReactNode
  title: string
  onClick?: () => void
  disabled?: boolean
  last?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      style={{
        width: 32,
        height: 32,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        color: disabled ? '#4a4a4a' : '#e6e1de',
        border: 'none',
        borderRight: last ? 'none' : '1px solid rgba(255,255,255,0.14)',
        cursor: disabled ? 'default' : 'pointer',
        padding: 0,
      }}
    >
      {children}
    </button>
  )
}

// Pixieset shows one combined up/down glyph rather than two separate arrow
// buttons. Kept as one visual slot in the pill (matching the reference) while
// staying two real, independently-working hit targets stacked top/bottom
// inside it - not a fake merged control.
function ReorderButton({
  index,
  length,
  onUp,
  onDown,
  last,
}: {
  index: number
  length: number
  onUp: () => void
  onDown: () => void
  last?: boolean
}) {
  const canUp = index > 0
  const canDown = index !== -1 && index < length - 1
  return (
    <div
      style={{
        position: 'relative',
        width: 32,
        height: 32,
        borderRight: last ? 'none' : '1px solid rgba(255,255,255,0.14)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e6e1de',
          pointerEvents: 'none',
        }}
      >
        <ReorderIcon />
      </span>
      <button
        type="button"
        title="Move up"
        aria-label="Move up"
        disabled={!canUp}
        onClick={(e) => {
          e.stopPropagation()
          onUp()
        }}
        style={{ position: 'absolute', inset: '0 0 50% 0', background: 'transparent', border: 'none', cursor: canUp ? 'pointer' : 'default', padding: 0 }}
      />
      <button
        type="button"
        title="Move down"
        aria-label="Move down"
        disabled={!canDown}
        onClick={(e) => {
          e.stopPropagation()
          onDown()
        }}
        style={{ position: 'absolute', inset: '50% 0 0 0', background: 'transparent', border: 'none', cursor: canDown ? 'pointer' : 'default', padding: 0 }}
      />
    </div>
  )
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  )
}

function ReorderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 7l4-4 4 4" />
      <path d="M8 17l4 4 4-4" />
    </svg>
  )
}
