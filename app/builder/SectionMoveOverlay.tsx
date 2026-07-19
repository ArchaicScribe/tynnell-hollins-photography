'use client'

import { usePuck } from '@measured/puck'

// TYN-328: Puck's built-in per-block hover overlay already provides Duplicate,
// Delete, and drag-to-reorder (its default ActionBar), and clicking any block
// already selects it and opens its settings in the right-hand Fields panel -
// so those parts of the ticket need no code here. The one gap Puck doesn't
// cover is a non-drag way to reorder: this override adds Move Up / Move Down
// buttons to the same hover overlay.
//
// Puck's `actionBar` override does not receive the component's id, only
// `label`/`children`/`parentAction` - there is no supported way to know which
// block a custom action bar button belongs to from there. `componentOverlay`
// does receive `componentId`, so the buttons are added there instead,
// positioned over the top-left corner of the block to sit clear of the
// default action bar's icons (top-right).
//
// Scoped to top-level content only (this codebase has no nested slot/dropzone
// fields today, so every real block lives in the root content array).
export function SectionMoveOverlay({
  children,
  componentId,
  hover,
  isSelected,
}: {
  children: React.ReactNode
  componentId: string
  componentType: string
  hover: boolean
  isSelected: boolean
}) {
  const { appState, dispatch } = usePuck()
  const content = appState.data.content
  const index = content.findIndex((item) => item.props.id === componentId)
  const visible = (hover || isSelected) && index !== -1

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
            top: 6,
            left: 6,
            zIndex: 2,
            display: 'flex',
            gap: 4,
            pointerEvents: 'auto',
          }}
        >
          <button
            type="button"
            title="Move up"
            aria-label="Move section up"
            disabled={index <= 0}
            onClick={(e) => {
              e.stopPropagation()
              move(-1)
            }}
            style={moveBtnStyle(index <= 0)}
          >
            &#8593;
          </button>
          <button
            type="button"
            title="Move down"
            aria-label="Move section down"
            disabled={index === -1 || index >= content.length - 1}
            onClick={(e) => {
              e.stopPropagation()
              move(1)
            }}
            style={moveBtnStyle(index === -1 || index >= content.length - 1)}
          >
            &#8595;
          </button>
        </div>
      )}
    </>
  )
}

function moveBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 24,
    height: 24,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a1a',
    color: disabled ? '#5a5a5a' : '#e6e1de',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 4,
    fontSize: 13,
    lineHeight: 1,
    cursor: disabled ? 'default' : 'pointer',
    padding: 0,
  }
}
