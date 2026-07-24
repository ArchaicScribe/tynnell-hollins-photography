'use client'

import { usePuck } from '@measured/puck'
import { FREEFORM_CONVERSIONS, canConvertToFreeform } from './freeformConversions'

// TYN-355 Phase 4 follow-up: one-way "Convert to Freeform" button, composed
// as a sibling of SectionHoverToolbar (which stays unmodified) for any
// top-level block that has a mapping in freeformConversions.ts. Renders
// nothing for block types with no mapping (live-data-bound blocks, multi-item
// list layouts with no fixed-position equivalent) or for FreeformSection
// itself (already freeform).
export function ConvertToFreeformTrigger({
  componentId,
  componentType,
  hover,
  isSelected,
}: {
  componentId: string
  componentType: string
  hover: boolean
  isSelected: boolean
}) {
  const { dispatch, getItemById, getSelectorForId } = usePuck()
  const visible = (hover || isSelected) && canConvertToFreeform(componentType)

  if (!visible) return null

  const convert = () => {
    const item = getItemById(componentId)
    const selector = getSelectorForId(componentId)
    if (!item || !selector) return
    const mapper = FREEFORM_CONVERSIONS[componentType]
    const elements = mapper(item.props as Record<string, unknown>).map((el) => ({
      type: el.type,
      props: { ...el.props, id: `${el.type}-${crypto.randomUUID()}` },
    }))
    const original = item.props as Record<string, unknown>
    const confirmed = window.confirm(
      `Convert this ${componentType} to a Freeform Section? This replaces it with ${elements.length} draggable element${elements.length === 1 ? '' : 's'} you can then rearrange. You can undo this with the Undo button.`,
    )
    if (!confirmed) return
    const replaceAction = {
      type: 'replace' as const,
      destinationIndex: selector.index,
      destinationZone: selector.zone,
      data: {
        type: 'FreeformSection',
        props: {
          // Puck's replace action requires props.id to exactly match the
          // item being replaced (node_modules/@measured/puck/dist/index.js's
          // replaceAction throws "Can't change the id during a replace
          // action" otherwise) - reusing componentId here, not a fresh id,
          // is what makes this work.
          id: componentId,
          canvasHeight: '65vh',
          elements,
          background: original.background ?? 'transparent',
          backgroundImage: original.backgroundImage ?? '',
          backgroundFade: original.backgroundFade ?? '0.55',
          scrollFadeIn: original.scrollFadeIn ?? false,
          spacing: original.spacing ?? 'normal',
          hideOnMobile: original.hideOnMobile ?? false,
          hideOnDesktop: original.hideOnDesktop ?? false,
        },
      },
    }
    dispatch(replaceAction)
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        convert()
      }}
      onMouseDown={(e) => e.stopPropagation()}
      title="Convert this block to a Freeform Section - one-way, but undoable"
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 20,
        pointerEvents: 'auto',
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
      }}
    >
      Convert to Freeform
    </button>
  )
}
