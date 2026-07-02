'use client'
// Returning null renders no DOM node at all. Payload's template grid
// (.template-default--nav-hydrated { grid-template-columns: 0 auto }) expects
// two grid items via auto-placement: nav in column 1 (forced to 0 width
// regardless of content), then .template-default__wrap in column 2. With no
// nav element in the DOM, .template-default__wrap is the only item and lands
// in column 1 instead - collapsing all admin content to 0px width. An empty
// div fixes the placement; the "0" column-1 track size still forces it to
// zero width either way, so this changes nothing visually.
export function EmptyNav() { return <div aria-hidden="true" /> }
