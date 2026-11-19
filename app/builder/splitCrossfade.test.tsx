// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// Step 5: the Split Image + Text photo can cross-fade through extra photos as the
// frame scrolls past, the Rising Roots signature effect.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const block = config.components.SplitImageText as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const draw = (props: any) => render(block.render({ ...block.defaultProps, imageUrl: '/a.jpg', photoMovement: 'none', body: 'Words', puck: {}, ...props }) as ReactElement).container
const layers = (c: HTMLElement) => [...c.querySelectorAll('[data-crossfade-layer]')].map((l) => l.getAttribute('src'))

describe('Split Image + Text extra photos', () => {
  it('offers an "extra photos" list in the editor, empty by default', () => {
    expect(block.fields.extraPhotos.type).toBe('array')
    expect(block.defaultProps.extraPhotos).toEqual([])
  })

  it('without extra photos renders the one photo exactly as before, with no crossfade wrapper', () => {
    const c = draw({})
    expect(c.querySelector('[data-crossfade]')).toBeNull()
    expect(c.querySelectorAll('img')).toHaveLength(1)
  })

  it('with extra photos crossfades the main photo then each extra, in order', () => {
    const c = draw({ extraPhotos: [{ imageUrl: '/b.jpg' }, { imageUrl: '/c.jpg' }] })
    expect(layers(c)).toEqual(['/a.jpg', '/b.jpg', '/c.jpg'])
  })

  it('ignores blank extra photo rows', () => {
    const c = draw({ extraPhotos: [{ imageUrl: '' }, { imageUrl: '  ' }, { imageUrl: '/b.jpg' }] })
    expect(layers(c)).toEqual(['/a.jpg', '/b.jpg'])
  })

  it('works in the Image overlay layout too', () => {
    const c = draw({ layout: 'overlay', extraPhotos: [{ imageUrl: '/b.jpg' }] })
    expect(layers(c)).toEqual(['/a.jpg', '/b.jpg'])
  })

  it('does not crossfade while the section is pinned by Scroll overlap, which would freeze it half-blended', () => {
    const c = draw({ scrollOverlap: true, extraPhotos: [{ imageUrl: '/b.jpg' }] })
    expect(c.querySelector('[data-crossfade]')).toBeNull()
    expect(c.querySelectorAll('img')).toHaveLength(1)
  })

  it('says in the editor which layouts the extra photos apply to', () => {
    expect(block.fields.extraPhotos.label).toMatch(/Side by side and Image overlay/)
  })

  it('does nothing without a main photo, because there is nothing to fade from', () => {
    const c = draw({ imageUrl: '', extraPhotos: [{ imageUrl: '/b.jpg' }] })
    expect(layers(c)).toEqual([])
  })
})
