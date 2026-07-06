// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryPicker } from './CategoryPicker'

describe('CategoryPicker', () => {
  it('shows a placeholder when no category is selected', () => {
    render(<CategoryPicker value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Click to select categories')).toBeInTheDocument()
  })

  it('shows the label for the selected category', () => {
    render(<CategoryPicker value="weddings" onChange={vi.fn()} />)
    expect(screen.getByText('Weddings')).toBeInTheDocument()
  })

  it('opens a listbox of options on click', () => {
    render(<CategoryPicker value={null} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Behind the Lens' })).toBeInTheDocument()
  })

  it('calls onChange and closes the listbox when an option is selected', () => {
    const onChange = vi.fn()
    render(<CategoryPicker value={null} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('option', { name: 'Client Education' }))
    expect(onChange).toHaveBeenCalledWith('client-education')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes the listbox on Escape', () => {
    render(<CategoryPicker value={null} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes the listbox when clicking outside', () => {
    render(<CategoryPicker value={null} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
