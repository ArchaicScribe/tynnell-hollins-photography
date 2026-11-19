// TYN-358: scroll maths for photo parallax, kept pure so it can be tested
// without a layout engine.

export type PhotoMovement = 'none' | 'gentle' | 'medium' | 'strong'

// How far the photo layer travels, as a fraction of the frame height, either
// side of centre. The layer is oversized by twice this amount so the frame never
// shows a gap. Retuned 2026-11-19 after measuring Rising Roots: its large photos
// drift about 0.5px per px scrolled. A frame of F px in a viewport of V px scrolls
// F + V px while visible and the photo shifts 2 * range * F, so the rate is
// 2 * range * F / (F + V). Strong lands just under the reference on a tall frame
// (a bigger range would crop and zoom every photo further); gentle stays subtle.
export const PARALLAX_RANGE: Record<Exclude<PhotoMovement, 'none'>, number> = {
  gentle: 0.12,
  medium: 0.22,
  strong: 0.35,
}

// 0 when the frame's top meets the bottom edge of the viewport, 1 when its
// bottom meets the top edge, clamped in between.
export function parallaxProgress(rect: { top: number; height: number }, viewportHeight: number): number {
  const travel = viewportHeight + rect.height
  if (travel <= 0) return 0
  const progress = (viewportHeight - rect.top) / travel
  return Math.min(1, Math.max(0, progress))
}

// Layer offset as a percent of the LAYER's own height (that is what a CSS
// translate percentage means): -range of the frame height entering (as far up as
// it may go), +range leaving (as far down). The layer is (1 + 2 * range) times the
// frame height, so the percent is scaled down by that, otherwise the layer travels
// too far and a strip opens at the frame edge. The photo moves down inside the
// frame while the page scrolls up, so it travels SLOWER than the page: that is the
// direction Rising Roots uses (measured 2026-11-19; this used to be inverted).
export function parallaxTranslatePercent(progress: number, range: number): number {
  return ((2 * progress - 1) * range * 100) / (1 + 2 * range)
}

// Motion is off for the system reduced-motion preference and for the /design
// "Enable animations" switch (data-animations="off" on <html>). Read on every
// frame so the live design preview can flip it without a reload.
export function motionAllowed(
  win: { matchMedia?: (query: string) => { matches: boolean } },
  doc: { documentElement: { getAttribute: (name: string) => string | null } },
): boolean {
  // No matchMedia (some embedded browsers, test environments) means there is no
  // reduced-motion preference to read.
  if (typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  return doc.documentElement.getAttribute('data-animations') !== 'off'
}
