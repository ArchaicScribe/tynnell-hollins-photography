'use client'

import { usePuck } from '@measured/puck'

// TYN-328 (revised): the prior implementation split the hover toolbar across
// two disconnected pieces (Puck's own default action bar top-right, a custom
// Move Up/Down overlay top-left) - functionally complete but visually nothing
// like Pixieset's actual reference, which is a single floating pill toolbar:
// "Change Layout" + "Open Editor" buttons, then a connected icon row
// (duplicate/delete/reorder). This rebuilds it as one unified toolbar
// matching that reference.
//
// Puck's default action bar is suppressed entirely (see EditorClient.tsx's
// `actionBar: () => null`) since its Duplicate/Delete can't be relocated into
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
// (Hero/SplitImageText/PhotoGallery per TYN-329) and, like "Open Editor",
// just selects the block - the layout picker is the first field in each of
// those blocks, so selecting surfaces it immediately. Not a separate
// floating picker; an honest simplification, not a fake button.
//
// Not included: Pixieset's "save as template" (bookmark) and "share" icons -
// this site has no template system or section-sharing feature to back them,
// and a button that does nothing would be worse than not having it.
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
            left: 10,
            zIndex: 20,
            display: 'flex',
            gap: 8,
            pointerEvents: 'auto',
          }}
        >
          <div style={pillStyle()}>
            {hasLayout && (
              <button
                type="button"
                style={textBtnStyle(true)}
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
              style={textBtnStyle(false)}
              onClick={(e) => {
                e.stopPropagation()
                select()
              }}
            >
              Open Editor
            </button>
          </div>
          <div style={pillStyle()}>
            <IconButton title="Duplicate" onClick={duplicate}>
              <CopyIcon />
            </IconButton>
            <IconButton title="Delete" onClick={remove}>
              <TrashIcon />
            </IconButton>
            <IconButton title="Move up" disabled={index <= 0} onClick={() => move(-1)}>
              <ArrowUpIcon />
            </IconButton>
            <IconButton title="Move down" disabled={index === -1 || index >= content.length - 1} onClick={() => move(1)} last>
              <ArrowDownIcon />
            </IconButton>
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

function textBtnStyle(bordered: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    background: 'transparent',
    color: '#e6e1de',
    fontSize: 12.5,
    fontWeight: 500,
    fontFamily: "var(--font-body, 'Roboto Mono', monospace)",
    border: 'none',
    borderRight: bordered ? '1px solid rgba(255,255,255,0.14)' : 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
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
  onClick: () => void
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
        onClick()
      }}
      style={{
        width: 32,
        height: 32,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        color: disabled ? '#5a5a5a' : '#e6e1de',
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

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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

function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  )
}

function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M19 12l-7 7-7-7" />
    </svg>
  )
}
