// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BackToStudio } from './BackToStudio'

describe('BackToStudio', () => {
  it('links to /studio, not /admin', () => {
    // The default Payload logo in this spot has no href at all, and /admin
    // redirects back to /studio via middleware anyway - this must point
    // straight at /studio so raw admin pages always have a real way back.
    render(<BackToStudio />)
    const link = screen.getByRole('link', { name: /back to studio/i })
    expect(link).toHaveAttribute('href', '/studio')
  })
})
