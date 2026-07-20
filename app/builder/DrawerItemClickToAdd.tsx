'use client'

import { usePuck } from '@measured/puck'

// TYN-340: the builder's own Help panel claims a block can be added by
// clicking it, not just dragging - but Puck's Drawer.Item has no click
// handler at all (confirmed by reading the compiled source: the sidebar
// item's only listener is onMouseDown preventDefault, purely to suppress
// native drag/text-select chrome). This override adds a real click-to-add
// path via Puck's `drawerItem` override (the current key - `componentItem`
// is deprecated), which hands us the clicked block's `name` directly.
//
// Appends a fresh instance of that component (with its own defaultProps) to
// the end of the page via a plain `setData` dispatch - the same public,
// documented usePuck() approach already used for TYN-328's Move Up/Down,
// deliberately avoiding Puck's private/unexported root-zone-id string.
// Coexists cleanly with drag: dnd-kit's drag activation requires pointer
// movement past a threshold, so a plain click (no movement) never competes
// with an actual drag gesture.
export function DrawerItemClickToAdd({ children, name }: { children: React.ReactNode; name: string }) {
  const { dispatch, config } = usePuck()

  const handleClick = () => {
    const componentConfig = (config.components as Record<string, { defaultProps?: Record<string, unknown> }>)[name]
    if (!componentConfig) return
    const id = `${name}-${crypto.randomUUID()}`
    dispatch({
      type: 'setData',
      data: (prev) => ({
        ...prev,
        content: [...prev.content, { type: name, props: { ...componentConfig.defaultProps, id } }],
      }),
    })
  }

  return (
    <div onClick={handleClick} title={`Add ${name}`} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  )
}
