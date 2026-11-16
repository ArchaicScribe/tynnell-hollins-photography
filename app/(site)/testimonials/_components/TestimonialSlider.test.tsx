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

describe('TestimonialSlider', () => {
  it('shows the first quote and one numbered button per testimonial', () => {
    render(<TestimonialSlider testimonials={testimonials} />)

    expect(screen.getByText(/Wonderful\./)).toBeInTheDocument()
    expect(screen.queryByText(/So easy\./)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['01', '02', '03'])
  })

  it('choosing 02 shows the second quote and marks 02 as current', () => {
    render(<TestimonialSlider testimonials={testimonials} />)

    fireEvent.click(screen.getByRole('button', { name: '02' }))

    expect(screen.getByText(/So easy\./)).toBeInTheDocument()
    expect(screen.queryByText(/Wonderful\./)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '02' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: '01' })).not.toHaveAttribute('aria-current', 'true')
  })

  it('ArrowRight and ArrowLeft on a numbered button move between quotes', () => {
    render(<TestimonialSlider testimonials={testimonials} />)

    fireEvent.keyDown(screen.getByRole('button', { name: '01' }), { key: 'ArrowRight' })
    expect(screen.getByText(/So easy\./)).toBeInTheDocument()

    fireEvent.keyDown(screen.getByRole('button', { name: '02' }), { key: 'ArrowLeft' })
    expect(screen.getByText(/Wonderful\./)).toBeInTheDocument()
  })
})
