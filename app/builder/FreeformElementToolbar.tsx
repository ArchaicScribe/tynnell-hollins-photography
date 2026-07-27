'use client'

import { usePuck } from '@measured/puck'

// TYN-355: componentOverlay for freeform child elements (TextElement/
// ImageElement/ButtonElement/ShapeElement), routed here by BuilderOverlay.tsx.
// Unlike SectionHoverToolbar (top-level blocks, reorder-by-list-position only),
// this toolbar supports direct drag/resize on the canvas, since each element
// carries its own x/y/width/height/rotate (percent-of-canvas) props.
//
// Puck already positions/sizes this overlay's portaled wrapper to exactly
// match the real element's on-screen rect (see DropZoneItem in Puck's source -
// the same mechanism SectionHoverToolbar relies on), so no rect math is needed
// just to place the toolbar UI. Rect math IS needed for drag/resize itself:
// converting mouse movement into percent-of-canvas deltas requires the
// FreeformSection's own canvas div, not Puck's per-node wrapper. Confirmed via
// the Phase 0 spike that `element.closest('[data-puck-dropzone]')`'s
// PARENT element is that canvas div - `offsetParent` does NOT reach it, since
// Puck injects its own `position:relative` wrapper directly around every slot
// child (same wrapper it uses for top-level blocks), one level closer than
// the canvas.
const MIN_SIZE = 5 // percent - keeps a drag/resize from collapsing an element to nothing

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), Math.max(min, max))
}

export function FreeformElementToolbar({
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
  const { dispatch, config, getItemById, getSelectorForId } = usePuck()
  const visible = hover || isSelected
  const label = (config.components as Record<string, { label?: string }>)[componentType]?.label ?? componentType

  const getCanvasRect = (): DOMRect | null => {
    const el = document.querySelector(`[data-puck-component="${CSS.escape(componentId)}"]`)
    const dropzone = el?.closest('[data-puck-dropzone]')
    const canvas = dropzone?.parentElement
    return canvas ? canvas.getBoundingClientRect() : null
  }

  const startDrag = (e: React.MouseEvent, mode: 'move' | 'resize') => {
    e.preventDefault()
    e.stopPropagation()
    const rect = getCanvasRect()
    const item = getItemById(componentId)
    const selector = getSelectorForId(componentId)
    if (!rect || !item || !selector) return
    const props = item.props as { x?: number; y?: number; width?: number; height?: number }
    const orig = { x: props.x ?? 0, y: props.y ?? 0, width: props.width ?? 20, height: props.height ?? 20 }
    const startX = e.clientX
    const startY = e.clientY

    const onMove = (ev: MouseEvent) => {
      const dxPct = ((ev.clientX - startX) / rect.width) * 100
      const dyPct = ((ev.clientY - startY) / rect.height) * 100
      const patch =
        mode === 'move'
          ? { x: clamp(orig.x + dxPct, 0, 100 - orig.width), y: clamp(orig.y + dyPct, 0, 100 - orig.height) }
          : { width: clamp(orig.width + dxPct, MIN_SIZE, 100 - orig.x), height: clamp(orig.height + dyPct, MIN_SIZE, 100 - orig.y) }
      dispatch({
        type: 'replace',
        destinationIndex: selector.index,
        destinationZone: selector.zone,
        data: { type: item.type, props: { ...item.props, ...patch } },
      })
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const select = () => {
    const selector = getSelectorForId(componentId)
    if (!selector) return
    dispatch({ type: 'setUi', ui: { itemSelector: selector } })
  }

  const duplicate = () => {
    const selector = getSelectorForId(componentId)
    if (!selector) return
    dispatch({ type: 'duplicate', sourceIndex: selector.index, sourceZone: selector.zone })
  }

  const remove = () => {
    const selector = getSelectorForId(componentId)
    if (!selector) return
    dispatch({ type: 'remove', index: selector.index, zone: selector.zone })
  }

  const reorder = (direction: -1 | 1) => {
    const selector = getSelectorForId(componentId)
    if (!selector) return
    const destinationIndex = selector.index + direction
    if (destinationIndex < 0) return
    dispatch({ type: 'reorder', sourceIndex: selector.index, destinationIndex, destinationZone: selector.zone })
  }

  return (
    <>
      {children}
      {visible && (
        <>
          {/* Full-rect drag hit area - grabbing the element anywhere moves it,
              matching Pixieset's direct-manipulation feel. Sits behind the
              toolbar pill and resize handle in DOM order so those stay clickable. */}
          <div
            onMouseDown={(e) => startDrag(e, 'move')}
            style={{ position: 'absolute', inset: 0, cursor: 'move', pointerEvents: 'auto' }}
          />
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
            <button
              type="button"
              style={soloBtnStyle()}
              onClick={(e) => {
                e.stopPropagation()
                select()
              }}
            >
              Edit {label}
            </button>
            <div style={pillStyle()}>
              <IconButton title="Bring forward" onClick={() => reorder(1)}>
                <LayerForwardIcon />
              </IconButton>
              <IconButton title="Send backward" onClick={() => reorder(-1)}>
                <LayerBackwardIcon />
              </IconButton>
              <IconButton title="Duplicate" onClick={duplicate}>
                <CopyIcon />
              </IconButton>
              <IconButton title="Delete" onClick={remove} last>
                <TrashIcon />
              </IconButton>
            </div>
          </div>
          <div
            onMouseDown={(e) => startDrag(e, 'resize')}
            title="Drag to resize"
            style={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#d6d1ce',
              border: '2px solid #1a1a1a',
              cursor: 'nwse-resize',
              pointerEvents: 'auto',
              zIndex: 20,
            }}
          />
        </>
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
  last,
}: {
  children: React.ReactNode
  title: string
  onClick?: () => void
  last?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        width: 32,
        height: 32,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        color: '#e6e1de',
        border: 'none',
        borderRight: last ? 'none' : '1px solid rgba(255,255,255,0.14)',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {children}
    </button>
  )
}

function LayerForwardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  )
}

function LayerBackwardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M18 13l-6 6-6-6" />
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

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  )
}
