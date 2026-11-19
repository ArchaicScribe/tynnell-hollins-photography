// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { config } from './puck.config'

// Step 5, item 7: repeated items (cards, steps, columns, stats) rise one after
// another, 120ms apart, instead of the whole block rising at once. The heading
// goes first (index 0), the items follow (1, 2, 3 ...). The delay is carried by a
// --i variable on each item; one rule injected at the root turns it into a
// transition delay, only while the section is revealing.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components = config.components as Record<string, any>
const draw = (name: string, props: Record<string, unknown>) =>
  render(components[name].render({ ...components[name].defaultProps, ...props, puck: {} }) as ReactElement)

const indexes = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('.pk-stagger')].map((el) => el.style.getPropertyValue('--i'))

const three = (make: (n: number) => Record<string, unknown>) => [1, 2, 3].map(make)

const cases: [string, Record<string, unknown>][] = [
  ['StatsRow', { heading: 'H', items: three((n) => ({ value: String(n), label: `L${n}` })) }],
  ['Services', { heading: 'H', items: three((n) => ({ name: `S${n}`, price: '$1', description: 'd', features: 'f' })) }],
  ['Testimonials', { heading: 'H', items: three((n) => ({ quote: `Q${n}`, name: `N${n}` })) }],
  ['PathChoice', { heading: 'H', cards: three((n) => ({ label: `C${n}`, href: `/c${n}`, imageUrl: '' })) }],
  ['Packages', { heading: 'H', cards: three((n) => ({ name: `P${n}`, price: '$1', description: 'd', features: 'f', buttonText: '', buttonHref: '' })) }],
  ['Steps', { heading: 'H', steps: three((n) => ({ title: `T${n}`, body: 'b' })) }],
  ['Accordion', { heading: 'H', items: three((n) => ({ title: `Q${n}`, body: 'a' })) }],
  ['FeatureColumns', { heading: 'H', columns: three((n) => ({ title: `F${n}`, lines: 'a\nb' })) }],
]

describe('staggered fade-up', () => {
  it.each(cases)('%s: heading first, then each item one step later', (name, props) => {
    const { container } = draw(name, props)

    expect(indexes(container)).toEqual(['0', '1', '2', '3'])
  })

  it('a block with no repeated items has nothing to stagger', () => {
    const { container } = draw('CTA', { heading: 'x' })

    expect(container.querySelector('.pk-stagger')).toBeNull()
  })

  it('the injected rule hides items while the section waits and delays each by its index', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const root = (config.root as any).render({ children: null }) as ReactElement
    const css = render(root).container.querySelector('style')!.innerHTML.replace(/:\s+/g, ':')

    expect(css).toMatch(/\[data-fade-phase="hidden"\]\s*\.pk-stagger\{[^}]*opacity:0[^}]*translateY\(48px\)/)
    expect(css).toMatch(/\[data-fade-phase="revealed"\]\s*\.pk-stagger\{[^}]*transition-delay:calc\(min\(var\(--i,0\),7\)\*120ms\)/)
    expect(css).toMatch(/\[data-fade-phase="revealed"\]\s*\.pk-stagger\{[^}]*var\(--motion-slow/)
  })
})
