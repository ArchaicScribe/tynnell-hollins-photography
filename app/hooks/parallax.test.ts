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
  it('starts at +range, crosses 0 in the middle, ends at -range (percent of frame height)', () => {
    expect(parallaxTranslatePercent(0, 0.15)).toBeCloseTo(15)
    expect(parallaxTranslatePercent(0.5, 0.15)).toBeCloseTo(0)
    expect(parallaxTranslatePercent(1, 0.15)).toBeCloseTo(-15)
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
