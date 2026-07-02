// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { EmptyNav } from './EmptyNav'

describe('EmptyNav', () => {
  it('renders a real DOM node, not null', () => {
    // Regression test: returning null here previously broke Payload's
    // two-column admin grid (.template-default--nav-hydrated { grid-template-
    // columns: 0 auto }). With no DOM node for the nav, the page content
    // wrapper became the only grid item and fell into column 1 (0px width)
    // via auto-placement instead of column 2, collapsing every admin page.
    // See TYN-285.
    const { container } = render(<EmptyNav />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders nothing visible (still functionally an empty nav)', () => {
    const { container } = render(<EmptyNav />)
    expect(container.textContent).toBe('')
  })
})
