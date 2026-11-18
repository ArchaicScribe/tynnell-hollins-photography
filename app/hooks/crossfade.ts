// Step 5: scroll maths for the in-frame photo crossfade, kept pure so it can be
// tested without a layout engine. Photos are stacked, the first at the bottom.

// The crossfade runs only through the middle of the frame's trip across the
// screen (parallaxProgress 0.25 to 0.75): the first photo is fully shown as the
// frame arrives and the last fully shown as it leaves. Tuned by eye, not copied
// from the Rising Roots reference.
export const CROSSFADE_START = 0.25
export const CROSSFADE_END = 0.75

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

// Opacity for each stacked photo at a scroll progress (0 to 1, as
// `parallaxProgress` returns). The bottom photo is always solid so the page never
// shows through mid-fade; each photo above it fades in over the one beneath, in
// order, and never fades back out while scrolling down.
export function crossfadeLayerOpacities(progress: number, count: number): number[] {
  if (count <= 0) return []
  const p = Number.isFinite(progress) ? progress : 0
  const position = clamp01((p - CROSSFADE_START) / (CROSSFADE_END - CROSSFADE_START)) * (count - 1)
  return Array.from({ length: count }, (_, i) => (i === 0 ? 1 : clamp01(position - (i - 1))))
}
