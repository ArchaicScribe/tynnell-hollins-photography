'use client'

import { SectionHoverToolbar } from './SectionHoverToolbar'
import { FreeformElementToolbar } from './FreeformElementToolbar'
import { AddElementTrigger } from './AddElementPanel'
import { ConvertToFreeformTrigger } from './ConvertToFreeformTrigger'

// TYN-355: single componentOverlay override wired into EditorClient.tsx,
// routing by componentType instead of having EditorClient know about the
// freeform builder's internals directly.
//
// - Freeform child elements (Text/Image/Button/Shape) get FreeformElementToolbar
//   (drag/resize/duplicate/delete/layer-order).
// - FreeformSection itself gets SectionHoverToolbar UNCHANGED (same Settings/
//   Duplicate/Delete/Move toolbar every other top-level block already has)
//   plus a sibling AddElementTrigger ("+ Add Element") - composed as siblings
//   rather than nested, since SectionHoverToolbar has no slot for extra UI and
//   deliberately stays untouched per the freeform-builder plan.
// - Every other existing block keeps its unmodified SectionHoverToolbar, plus
//   a sibling ConvertToFreeformTrigger ("Convert to Freeform") for whichever
//   block types have a mapping in freeformConversions.ts - renders nothing for
//   types with no mapping, so most blocks look completely unchanged.
const FREEFORM_ELEMENT_TYPES = new Set([
  'TextElement', 'ImageElement', 'ButtonElement', 'ShapeElement',
  'VideoElement', 'LineElement', 'ImageCarouselElement', 'ImageGridElement', 'ImageSlideshowElement',
  'ContactFormElement', 'MapElement', 'SocialLinksElement', 'InstagramFeedElement', 'AccordionElement', 'TypewriterTextElement',
])

export function BuilderOverlay(props: {
  children: React.ReactNode
  componentId: string
  componentType: string
  hover: boolean
  isSelected: boolean
}) {
  if (FREEFORM_ELEMENT_TYPES.has(props.componentType)) {
    return <FreeformElementToolbar {...props} />
  }
  if (props.componentType === 'FreeformSection') {
    return (
      <>
        <SectionHoverToolbar {...props} />
        <AddElementTrigger componentId={props.componentId} hover={props.hover} isSelected={props.isSelected} />
      </>
    )
  }
  return (
    <>
      <SectionHoverToolbar {...props} />
      <ConvertToFreeformTrigger componentId={props.componentId} componentType={props.componentType} hover={props.hover} isSelected={props.isSelected} />
    </>
  )
}
