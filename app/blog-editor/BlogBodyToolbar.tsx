'use client'

import { usePuck } from '@measured/puck'

// Bottom insert-block toolbar, replacing Puck's default left-side drag
// palette (hidden via overrides.drawer in BlogPostCanvas). Must render inside
// <Puck> so usePuck() has a live dispatch. Inserting a block auto-selects it,
// so the (still-visible) fields panel immediately shows its editable props.
const BLOCKS: { type: string; label: string; icon: string }[] = [
  { type: 'Text', label: 'Text', icon: 'T' },
  { type: 'Image', label: 'Image', icon: '\u{1F5BC}' },
  { type: 'ImageGrid', label: 'Image Grid', icon: '\u{25A6}' },
  { type: 'Video', label: 'Video', icon: '▶' },
]

export function BlogBodyToolbar() {
  const { appState, dispatch } = usePuck()

  const insert = (componentType: string) => {
    dispatch({
      type: 'insert',
      componentType,
      destinationIndex: appState.data.content.length,
      destinationZone: 'root:default-zone',
    })
  }

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.85rem',
        background: 'rgba(26,26,26,0.95)',
        borderTop: '1px solid rgba(214,209,206,0.12)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {BLOCKS.map(b => (
        <button
          key={b.type}
          type="button"
          onClick={() => insert(b.type)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            padding: '0.5rem 0.85rem',
            background: 'transparent',
            border: '1px solid rgba(214,209,206,0.18)',
            borderRadius: 6,
            color: '#D6D1CE',
            cursor: 'pointer',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <span aria-hidden="true" style={{ fontSize: '1.1rem', lineHeight: 1 }}>{b.icon}</span>
          <span style={{ fontSize: '0.65rem' }}>{b.label}</span>
        </button>
      ))}
    </div>
  )
}
