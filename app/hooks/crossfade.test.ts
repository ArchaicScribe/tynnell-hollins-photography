import { describe, it, expect } from 'vitest'
import { crossfadeLayerOpacities, CROSSFADE_START, CROSSFADE_END } from './crossfade'

// Photos are stacked, the first at the bottom. Scrolling fades each upper photo
// in over the one beneath, in order. The bottom photo is always solid, so the page
// never shows through mid-fade.

describe('crossfadeLayerOpacities', () => {
  it('shows only the first photo before the crossfade starts', () => {
    expect(crossfadeLayerOpacities(0, 3)).toEqual([1, 0, 0])
    expect(crossfadeLayerOpacities(CROSSFADE_START, 3)).toEqual([1, 0, 0])
  })

  it('shows every layer fully on once the crossfade has finished, so the last photo is on top', () => {
    expect(crossfadeLayerOpacities(CROSSFADE_END, 3)).toEqual([1, 1, 1])
    expect(crossfadeLayerOpacities(1, 3)).toEqual([1, 1, 1])
  })

  it('fades the second photo in first, then the third, with a midway blend halfway through', () => {
    const mid = (CROSSFADE_START + CROSSFADE_END) / 2
    expect(crossfadeLayerOpacities(mid, 3)).toEqual([1, 1, 0]) // photo two fully in, three not started
    const quarter = CROSSFADE_START + (CROSSFADE_END - CROSSFADE_START) / 4
    const [a, b, c] = crossfadeLayerOpacities(quarter, 3)
    expect([a, c]).toEqual([1, 0])
    expect(b).toBeCloseTo(0.5)
  })

  it('keeps the bottom layer solid and every other layer between 0 and 1, at any progress', () => {
    for (let p = -0.5; p <= 1.5; p += 0.05) {
      const layers = crossfadeLayerOpacities(p, 4)
      expect(layers[0]).toBe(1)
      for (const o of layers) {
        expect(o).toBeGreaterThanOrEqual(0)
        expect(o).toBeLessThanOrEqual(1)
      }
    }
  })

  it('never lets an upper photo fade out again as you keep scrolling down', () => {
    let previous = crossfadeLayerOpacities(0, 4)
    for (let p = 0; p <= 1; p += 0.02) {
      const now = crossfadeLayerOpacities(p, 4)
      now.forEach((o, i) => expect(o).toBeGreaterThanOrEqual(previous[i] - 1e-9))
      previous = now
    }
  })

  it('handles one photo, no photos and a broken progress value without throwing', () => {
    expect(crossfadeLayerOpacities(0.5, 1)).toEqual([1])
    expect(crossfadeLayerOpacities(0.5, 0)).toEqual([])
    expect(crossfadeLayerOpacities(Number.NaN, 3)).toEqual([1, 0, 0])
  })
})
