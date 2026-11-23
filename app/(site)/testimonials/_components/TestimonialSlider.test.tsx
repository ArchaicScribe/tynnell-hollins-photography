// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TestimonialSlider from './TestimonialSlider'
import type { TestimonialItem } from './TestimonialsList'

const testimonials: TestimonialItem[] = [
  { id: 1, clientName: 'Ana', quote: 'Wonderful.' },
  { id: 2, clientName: 'Ben', quote: 'So easy.' },
  { id: 3, clientName: 'Cai', quote: 'Loved it.' },
]

// A control reads "01" on screen, which means nothing to a screen reader on its own, so its
// accessible name also says what it opens. The visible number stays in the name.
const control = (n: string) => screen.getByRole('button', { name: new RegExp(`^Quote ${n}:`) })

describe('TestimonialSlider', () => {
  it('shows the first quote and one numbered button per testimonial', () => {
    render(<TestimonialSlider testimonials={testimonials} />)

    expect(screen.getByText(/Wonderful\./)).toBeInTheDocument()
    expect(screen.queryByText(/So easy\./)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['01', '02', '03'])
  })

  it('choosing 02 shows the second quote and marks 02 as current', () => {
    render(<TestimonialSlider testimonials={testimonials} />)

    fireEvent.click(control('02'))

    expect(screen.getByText(/So easy\./)).toBeInTheDocument()
    expect(screen.queryByText(/Wonderful\./)).not.toBeInTheDocument()
    expect(control('02')).toHaveAttribute('aria-current', 'true')
    expect(control('01')).not.toHaveAttribute('aria-current', 'true')
  })

  it('ArrowRight and ArrowLeft on a numbered button move between quotes', () => {
    render(<TestimonialSlider testimonials={testimonials} />)

    fireEvent.keyDown(control('01'), { key: 'ArrowRight' })
    expect(screen.getByText(/So easy\./)).toBeInTheDocument()

    fireEvent.keyDown(control('02'), { key: 'ArrowLeft' })
    expect(screen.getByText(/Wonderful\./)).toBeInTheDocument()
  })

  it('names each control by its number and whose quote it opens', () => {
    render(<TestimonialSlider testimonials={testimonials} />)

    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Quote 01: Ana', 'Quote 02: Ben', 'Quote 03: Cai'])
  })

  it('moves focus to the control it moves to, so the next arrow press carries on from there', () => {
    render(<TestimonialSlider testimonials={testimonials} />)
    control('01').focus()

    fireEvent.keyDown(control('01'), { key: 'ArrowRight' })
    expect(control('02')).toHaveFocus()

    fireEvent.keyDown(control('02'), { key: 'ArrowRight' })
    expect(control('03')).toHaveFocus()

    fireEvent.keyDown(control('03'), { key: 'ArrowRight' })
    expect(control('01')).toHaveFocus() // wraps round

    fireEvent.keyDown(control('01'), { key: 'ArrowLeft' })
    expect(control('03')).toHaveFocus()
  })
})
