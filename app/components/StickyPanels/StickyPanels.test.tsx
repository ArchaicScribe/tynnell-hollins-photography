// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import type { ReactElement } from 'react'
import StickyPanels, { type StickyPanel } from './StickyPanels'
import { config } from '@/app/builder/puck.config'

// jsdom has no IntersectionObserver. This fake keeps the callback so a test
// can say "this panel is now in view", the way scrolling would.
let fireIntersection: (target: Element) => void
class FakeIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    fireIntersection = (target) =>
      cb(
        [{ isIntersecting: true, target, boundingClientRect: { top: 0 } } as unknown as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      )
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const panels: StickyPanel[] = [
  { imageUrl: 'https://media.example/dog.jpg', heading: 'My dog', text: 'My favorite editing buddy.' },
  { imageUrl: 'https://media.example/forest.jpg', heading: 'Forest walks', text: 'Where I recharge.' },
  { imageUrl: '', heading: 'Slow mornings', text: 'Coffee before anything else.' },
]

const pinnedPhoto = () => screen.getByTestId('sticky-panels-photo').querySelector('img')
const panelFor = (heading: string) => screen.getByText(heading).closest('article') as Element

describe('StickyPanels (Rising Roots "things that make my heart full")', () => {
  beforeEach(() => vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver))
  afterEach(() => vi.unstubAllGlobals())

  it('shows every panel heading and its text', () => {
    render(<StickyPanels panels={panels} />)

    for (const p of panels) {
      expect(screen.getByText(p.heading)).toBeInTheDocument()
      expect(screen.getByText(p.text)).toBeInTheDocument()
    }
  })

  it('pins the first panel photo before anything has scrolled', () => {
    render(<StickyPanels panels={panels} />)

    expect(pinnedPhoto()).toHaveAttribute('src', 'https://media.example/dog.jpg')
    expect(pinnedPhoto()).toHaveAttribute('alt', 'My dog')
  })

  it('swaps the pinned photo to the panel scrolled into view', () => {
    render(<StickyPanels panels={panels} />)

    act(() => fireIntersection(panelFor('Forest walks')))

    expect(pinnedPhoto()).toHaveAttribute('src', 'https://media.example/forest.jpg')
  })

  it('keeps the last photo when the panel in view has none, instead of going blank', () => {
    render(<StickyPanels panels={panels} />)

    act(() => fireIntersection(panelFor('Forest walks')))
    act(() => fireIntersection(panelFor('Slow mornings')))

    expect(pinnedPhoto()).toHaveAttribute('src', 'https://media.example/forest.jpg')
  })

  it('leaves out a panel that has nothing in it yet', () => {
    render(<StickyPanels panels={[panels[0], { imageUrl: '', heading: '', text: '' }]} />)

    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('renders nothing when there are no panels with content', () => {
    const { container } = render(<StickyPanels panels={[{ imageUrl: '', heading: '', text: '' }]} />)

    expect(container).toBeEmptyDOMElement()
  })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const block = (config.components as Record<string, any>).StickyPanels

describe('Sticky Panels builder block', () => {
  beforeEach(() => vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver))
  afterEach(() => vi.unstubAllGlobals())

  it('is offered in the builder block drawer', () => {
    const offered = Object.values(config.categories ?? {}).flatMap((c) => c.components ?? [])

    expect(offered).toContain('StickyPanels')
  })

  it('gives each panel a photo, a heading and text', () => {
    expect(Object.keys(block.fields.panels.arrayFields)).toEqual(['imageUrl', 'heading', 'text'])
  })

  it('has the same background, spacing and per-device controls as every other block', () => {
    expect(Object.keys(block.fields)).toEqual(
      expect.arrayContaining(['photoSide', 'background', 'spacing', 'scrollOverlap', 'hideOnMobile', 'hideOnDesktop']),
    )
  })

  it('renders the section heading and the panels', () => {
    render(block.render({ ...block.defaultProps, heading: 'Things I love', panels, puck: {} }) as ReactElement)

    expect(screen.getByRole('heading', { name: 'Things I love' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })
})
