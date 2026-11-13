// TYN-358: scroll maths for photo parallax, kept pure so it can be tested
// without a layout engine.

export type PhotoMovement = 'none' | 'gentle' | 'medium' | 'strong'

// How far the photo layer travels, as a fraction of the frame height, either
// side of centre. The layer is oversized by twice this amount so the frame never
// shows a gap. Tuned by eye against the Rising Roots reference, not copied from
// its raw numbers.
export const PARALLAX_RANGE: Record<Exclude<PhotoMovement, 'none'>, number> = {
  gentle: 0.08,
  medium: 0.15,
  strong: 0.25,
}

// 0 when the frame's top meets the bottom edge of the viewport, 1 when its
// bottom meets the top edge, clamped in between.
export function parallaxProgress(rect: { top: number; height: number }, viewportHeight: number): number {
  const travel = viewportHeight + rect.height
  if (travel <= 0) return 0
  const progress = (viewportHeight - rect.top) / travel
  return Math.min(1, Math.max(0, progress))
}

// Layer offset as a percent of the frame height: +range entering, -range
// leaving. The photo therefore moves faster than the page, as on the reference.
export function parallaxTranslatePercent(progress: number, range: number): number {
  return (1 - 2 * progress) * range * 100
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
