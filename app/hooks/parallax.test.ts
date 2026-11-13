import { describe, it, expect } from 'vitest'
import { PARALLAX_RANGE, parallaxProgress, parallaxTranslatePercent, motionAllowed } from './parallax'

// TYN-358: photo parallax. Progress is how far a frame has travelled through
// the viewport: 0 when its top meets the bottom edge, 1 when its bottom meets
// the top edge. The offset is a percent of the frame's own height.

describe('parallaxProgress', () => {
  const vh = 800

  it('is 0 when the frame top meets the bottom of the viewport', () => {
    expect(parallaxProgress({ top: 800, height: 400 }, vh)).toBe(0)
  })

  it('is 1 when the frame bottom meets the top of the viewport', () => {
    expect(parallaxProgress({ top: -400, height: 400 }, vh)).toBe(1)
  })

  it('is 0.5 when the frame is exactly centred', () => {
    expect(parallaxProgress({ top: 200, height: 400 }, vh)).toBe(0.5)
  })

  it('clamps to 0 and 1 when the frame is far off screen', () => {
    expect(parallaxProgress({ top: 5000, height: 400 }, vh)).toBe(0)
    expect(parallaxProgress({ top: -5000, height: 400 }, vh)).toBe(1)
  })

  it('does not divide by zero for an empty frame in an empty viewport', () => {
    expect(parallaxProgress({ top: 0, height: 0 }, 0)).toBe(0)
  })
})

describe('parallaxTranslatePercent', () => {
  // The percent is of the LAYER's own height, and the layer is (1 + 2 * range)
  // times the frame height, so it must be scaled down or the layer travels too
  // far and a gap opens at the frame edge.
  it('is 0 in the middle and symmetric either side', () => {
    expect(parallaxTranslatePercent(0.5, 0.15)).toBeCloseTo(0)
    expect(parallaxTranslatePercent(0, 0.15)).toBeCloseTo(-parallaxTranslatePercent(1, 0.15))
    expect(parallaxTranslatePercent(0, 0.15)).toBeGreaterThan(0)
  })

  it('travels exactly range times the frame height in pixels at either end', () => {
    for (const range of Object.values(PARALLAX_RANGE)) {
      const frame = 1000
      const layer = frame * (1 + 2 * range)
      const px = (parallaxTranslatePercent(0, range) / 100) * layer
      expect(px).toBeCloseTo(range * frame)
    }
  })

  it('never lets the layer leave a gap inside the frame, at any progress', () => {
    for (const range of Object.values(PARALLAX_RANGE)) {
      const frame = 1000
      const layer = frame * (1 + 2 * range)
      const top = -range * frame
      for (let p = 0; p <= 1.0001; p += 0.05) {
        const shift = (parallaxTranslatePercent(p, range) / 100) * layer
        expect(top + shift).toBeLessThanOrEqual(1e-6)
        expect(top + layer + shift).toBeGreaterThanOrEqual(frame - 1e-6)
      }
    }
  })
})

describe('PARALLAX_RANGE', () => {
  it('grows from gentle to medium to strong', () => {
    expect(PARALLAX_RANGE.gentle).toBeLessThan(PARALLAX_RANGE.medium)
    expect(PARALLAX_RANGE.medium).toBeLessThan(PARALLAX_RANGE.strong)
  })
})

describe('motionAllowed', () => {
  const doc = (animations?: string) => ({ documentElement: { getAttribute: (n: string) => (n === 'data-animations' ? (animations ?? null) : null) } })
  const win = (reduce: boolean) => ({ matchMedia: () => ({ matches: reduce }) })

  it('allows motion by default', () => {
    expect(motionAllowed(win(false), doc())).toBe(true)
  })

  it('blocks motion when the system asks for reduced motion', () => {
    expect(motionAllowed(win(true), doc())).toBe(false)
  })

  it('blocks motion when the /design animations switch is off', () => {
    expect(motionAllowed(win(false), doc('off'))).toBe(false)
  })

  it('does not throw where matchMedia does not exist (embedded browsers, test environments)', () => {
    expect(motionAllowed({} as never, doc())).toBe(true)
    expect(motionAllowed({} as never, doc('off'))).toBe(false)
  })
})
