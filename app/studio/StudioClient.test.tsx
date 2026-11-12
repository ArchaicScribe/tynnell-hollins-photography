// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StudioClient } from './StudioClient'

// TYN-311: the Studio dashboard's "Create Collection" used to link to
// /gallery-editor?new=1, which redirects to the Collections list and never
// opened anything. It now goes straight to the Create New Collection page.
describe('Studio dashboard', () => {
  it('links Create Collection to the Create New Collection page', () => {
    render(<StudioClient userName="Alex" userRole="admin" galleries={[]} photos={[]} />)

    expect(screen.getByRole('link', { name: 'Create Collection' })).toHaveAttribute('href', '/gallery-editor/new')
  })

  it('shows the same link to an editor account', () => {
    render(<StudioClient userName="Tynnell" userRole="editor" galleries={[]} photos={[]} />)

    expect(screen.getByRole('link', { name: 'Create Collection' })).toHaveAttribute('href', '/gallery-editor/new')
  })
})
