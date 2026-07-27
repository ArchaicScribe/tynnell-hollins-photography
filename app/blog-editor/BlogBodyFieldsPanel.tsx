'use client'

import { Puck, createUsePuck, useGetPuck } from '@measured/puck'

// Puck's default layout puts Puck.Fields in a permanent right sidebar as part
// of its own header/sidebar/preview grid. BlogPostCanvas replaces that whole
// layout with just <Puck.Preview /> + the bottom toolbar, so without this
// panel an inserted block would have no way to edit its props. Only shows
// once a block is selected (clicking a block in the preview sets this
// automatically), and closing it deselects rather than deleting anything.
//
// Scoped selector (createUsePuck) instead of the bare usePuck() this file
// previously called - the panel is always mounted (just conditionally
// returns null), so the bare hook re-rendered it, and everything inside
// <Puck.Fields />, on every keystroke/edit anywhere in the blog body, not
// just when selection actually changed. Same re-render-storm bug found and
// fixed in the page builder (see app/builder/SectionHoverToolbar.tsx).
// itemSelector/selectedItem genuinely need to be reactive (they drive
// whether this panel shows and its title); dispatch is only used in the
// close handler, so it goes through useGetPuck() instead.
const usePuck = createUsePuck()

export function BlogBodyFieldsPanel() {
  const selector = usePuck((s) => s.appState.ui.itemSelector)
  const selectedItem = usePuck((s) => s.selectedItem)
  const getPuck = useGetPuck()

  if (!selector || !selectedItem) return null

  const close = () => getPuck().dispatch({ type: 'setUi', ui: { itemSelector: null } })

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
