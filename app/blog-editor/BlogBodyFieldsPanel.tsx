'use client'

import { Puck, usePuck } from '@measured/puck'

// Puck's default layout puts Puck.Fields in a permanent right sidebar as part
// of its own header/sidebar/preview grid. BlogPostCanvas replaces that whole
// layout with just <Puck.Preview /> + the bottom toolbar, so without this
// panel an inserted block would have no way to edit its props. Only shows
// once a block is selected (clicking a block in the preview sets this
// automatically), and closing it deselects rather than deleting anything.
export function BlogBodyFieldsPanel() {
  const { appState, dispatch, selectedItem } = usePuck()
  const selector = appState.ui.itemSelector

  if (!selector || !selectedItem) return null

  const close = () => dispatch({ type: 'setUi', ui: { itemSelector: null } })

  return (
    <div
      role="dialog"
      aria-label="Edit block"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 320,
        maxWidth: '90vw',
        background: '#1a1a1a',
        borderLeft: '1px solid rgba(214,209,206,0.15)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 24px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', borderBottom: '1px solid rgba(214,209,206,0.12)' }}>
        <span style={{ color: '#D6D1CE', fontWeight: 600, fontSize: '0.85rem', fontFamily: "'Poppins', sans-serif" }}>
          Edit {selectedItem.type}
        </span>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          style={{ background: 'none', border: 'none', color: '#9B9A9A', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '0.25rem' }}
        >
          &times;
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 1rem' }}>
        <Puck.Fields />
      </div>
    </div>
  )
}
