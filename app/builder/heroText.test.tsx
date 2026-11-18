// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hero = (config.components as Record<string, any>).Hero

function drawHero(props: Record<string, unknown>) {
  return render(hero.render({ ...hero.defaultProps, ...props, puck: {} }) as ReactElement)
}

// Light means white or the Rising Roots cream (#ECE9E0), never a theme colour.
const isLight = (color: string) =>
  /^rgba\((255, 255, 255|236, 233, 224)/.test(color) || color === 'rgb(236, 233, 224)' || color === '#fff' || color === 'white'

// The hero's overlay is always dark, so on the light Rising Roots theme the
// theme heading and body colours (olive and near-black) vanished into the photo.
// Found on the Home preview 2026-11-16.
describe('Hero text over the photograph', () => {
  const words = { heading: 'Lost in the Moment', subheading: 'Weddings', eyebrow: 'Hello', imageUrl: '/a.jpg' }

  it.each(['bottom', 'centered'])('is light in the %s layout, whatever the theme colours are', (layout) => {
    const { container } = drawHero({ ...words, layout })

    expect(isLight(container.querySelector('h1')!.style.color)).toBe(true)
    const sub = [...container.querySelectorAll('p')].find((p) => p.textContent === 'Weddings')!
    expect(isLight(sub.style.color)).toBe(true)
    const eyebrow = [...container.querySelectorAll('p')].find((p) => p.textContent === 'Hello')!
    expect(isLight(eyebrow.style.color)).toBe(true)
  })

  it('stays light with no photo, because the empty hero is dark too', () => {
    const { container } = drawHero({ ...words, imageUrl: '', layout: 'bottom' })

    expect(isLight(container.querySelector('h1')!.style.color)).toBe(true)
  })

  it('leaves the split layout alone: its text sits on the page ground, not on the photo', () => {
    const { container } = drawHero({ ...words, layout: 'split' })

    expect(isLight(container.querySelector('h1')!.style.color)).toBe(false)
  })
})

// A blank page (a new inner page before Tynnell adds words) used to render an
// empty <h1>, which screen readers announce as an empty heading.
describe('Hero with no heading', () => {
  it.each(['bottom', 'centered', 'split'])('renders no <h1> in the %s layout', (layout) => {
    const { container } = drawHero({ heading: '   ', subheading: 'Weddings', layout })

    expect(container.querySelector('h1')).toBeNull()
  })

  it('still renders the <h1> once there is a heading', () => {
    const { container } = drawHero({ heading: 'Hello', layout: 'bottom' })

    expect(container.querySelector('h1')?.textContent).toBe('Hello')
  })
})
