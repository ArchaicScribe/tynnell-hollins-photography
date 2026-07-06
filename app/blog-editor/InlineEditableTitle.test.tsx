// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InlineEditableTitle } from './InlineEditableTitle'

describe('InlineEditableTitle', () => {
  it('renders the value as a button by default', () => {
    render(<InlineEditableTitle value="My Post" onCommit={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'My Post' })).toBeInTheDocument()
  })

  it('falls back to a placeholder when the value is empty', () => {
    render(<InlineEditableTitle value="" onCommit={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Untitled Post' })).toBeInTheDocument()
  })

  it('switches to an editable input on click', () => {
    render(<InlineEditableTitle value="My Post" onCommit={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'My Post' }))
    expect(screen.getByRole('textbox', { name: 'Post title' })).toHaveValue('My Post')
  })

  it('commits the new value on Enter', () => {
    const onCommit = vi.fn()
    render(<InlineEditableTitle value="My Post" onCommit={onCommit} />)
    fireEvent.click(screen.getByRole('button', { name: 'My Post' }))
    const input = screen.getByRole('textbox', { name: 'Post title' })
    fireEvent.change(input, { target: { value: 'New Title' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onCommit).toHaveBeenCalledWith('New Title')
  })

  it('commits the new value on blur', () => {
    const onCommit = vi.fn()
    render(<InlineEditableTitle value="My Post" onCommit={onCommit} />)
    fireEvent.click(screen.getByRole('button', { name: 'My Post' }))
    const input = screen.getByRole('textbox', { name: 'Post title' })
    fireEvent.change(input, { target: { value: 'Blurred Title' } })
    fireEvent.blur(input)
    expect(onCommit).toHaveBeenCalledWith('Blurred Title')
  })

  it('does not commit an unchanged or empty value', () => {
    const onCommit = vi.fn()
    render(<InlineEditableTitle value="My Post" onCommit={onCommit} />)
    fireEvent.click(screen.getByRole('button', { name: 'My Post' }))
    const input = screen.getByRole('textbox', { name: 'Post title' })
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.blur(input)
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('reverts to the original value on Escape without committing', () => {
    const onCommit = vi.fn()
    render(<InlineEditableTitle value="My Post" onCommit={onCommit} />)
    fireEvent.click(screen.getByRole('button', { name: 'My Post' }))
    const input = screen.getByRole('textbox', { name: 'Post title' })
    fireEvent.change(input, { target: { value: 'Discarded' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onCommit).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'My Post' })).toBeInTheDocument()
  })
})
