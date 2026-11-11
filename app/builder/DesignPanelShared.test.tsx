// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { DesignSections } from './DesignPanelShared'
import { DEFAULT_THEME, type SiteTheme } from '@/app/lib/siteTheme'

afterEach(cleanup)

function renderPanel(theme: Partial<SiteTheme> = {}, open: string | null = 'navbar') {
  const set = vi.fn()
  render(
    <DesignSections
      theme={{ ...DEFAULT_THEME, ...theme }}
      set={set}
      open={open}
      setOpen={vi.fn()}
      ImagePickerField={() => null}
    />,
  )
  return set
}

// TYN-352: the navbar colors are optional. Empty means "follow the button
// colors", so unlike every other color control there has to be a way back.
describe('Design panel: Navbar section', () => {
  it('has a Navbar section that opens', () => {
    renderPanel({}, null)

    expect(screen.getByRole('button', { name: /^Navbar/ })).toBeTruthy()
  })

  it('offers a background and a text color for the solid navbar', () => {
    renderPanel()

    expect(screen.getByRole('textbox', { name: 'Navbar color' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Navbar text color' })).toBeTruthy()
  })

  it('saves a typed navbar color to the right setting', () => {
    const set = renderPanel()

    fireEvent.change(screen.getByRole('textbox', { name: 'Navbar color' }), { target: { value: '#102030' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Navbar text color' }), { target: { value: '#f0e0d0' } })

    expect(set).toHaveBeenCalledWith('colorNavBg', '#102030')
    expect(set).toHaveBeenCalledWith('colorNavText', '#f0e0d0')
  })

  // An empty navbar color is not black. The swatch has no value to show, so
  // it is dimmed rather than presenting a black that was never chosen.
  it('dims the swatch while the navbar color is empty, and not once it is set', () => {
    renderPanel({ colorNavBg: '' })
    const empty = screen.getByLabelText('Navbar color picker') as HTMLElement
    expect(empty.style.opacity).toBe('0.35')
    cleanup()

    renderPanel({ colorNavBg: '#102030' })
    const set = screen.getByLabelText('Navbar color picker') as HTMLElement
    expect(set.style.opacity).toBe('')
  })

  it('tells the user to check text contrast when changing the bar color', () => {
    renderPanel()

    expect(screen.getByText(/check that the text color still reads/i)).toBeTruthy()
  })

  it('shows no reset while a color is following the button colors', () => {
    renderPanel({ colorNavBg: '', colorNavText: '' })

    expect(screen.queryByRole('button', { name: 'Use button color' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Use button text color' })).toBeNull()
  })

  it('clears a chosen navbar color back to following the button colors', () => {
    const set = renderPanel({ colorNavBg: '#102030', colorNavText: '#f0e0d0' })

    fireEvent.click(screen.getByRole('button', { name: 'Use button color' }))
    fireEvent.click(screen.getByRole('button', { name: 'Use button text color' }))

    expect(set).toHaveBeenCalledWith('colorNavBg', '')
    expect(set).toHaveBeenCalledWith('colorNavText', '')
  })
})
