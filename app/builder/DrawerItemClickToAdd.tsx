'use client'

import { usePuck } from '@measured/puck'
import { DRAWER_ICONS, DefaultDrawerIcon } from './DrawerIcons'

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
//
// TYN-355 follow-up: also replaces Puck's own plain-text drawer row with an
// icon tile (matching AddElementPanel.tsx's icon-grid look), since the main
// Components drawer was the one piece of the Pixieset rearchitecture that
// had never actually been re-skinned - only the freeform in-canvas editing
// mechanics had. `[data-puck-drawer]`/`[data-puck-drawer-item]` (stable data
// attributes Puck itself renders around this override, not CSS-module
// classnames) get the grid/tile layout in puck-theme.css; this component only
// needs to supply the tile's actual content.
export function DrawerItemClickToAdd({ name }: { children: React.ReactNode; name: string }) {
  const { dispatch, config } = usePuck()
  const Icon = DRAWER_ICONS[name] ?? DefaultDrawerIcon
  const label = (config.components as Record<string, { label?: string }>)[name]?.label ?? name

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
    <div onClick={handleClick} title={`Add ${label}`} className="pk-drawer-tile">
      <span className="pk-drawer-tile-icon"><Icon /></span>
      <span className="pk-drawer-tile-label">{label}</span>
    </div>
  )
}
