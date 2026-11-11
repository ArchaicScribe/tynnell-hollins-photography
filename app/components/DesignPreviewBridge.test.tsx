// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { DesignPreviewBridge } from './DesignPreviewBridge'

// The bridge only acts inside the /design editor's preview: loaded with
// ?__designPreview=1 and opened by a window (the popped-out tab case, which is
// the one jsdom can model, since window.top is window itself here).
function sendTheme(vars: Record<string, string>) {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { type: 'THP_DESIGN_PREVIEW', vars },
      origin: window.location.origin,
    }),
  )
}

const root = () => document.documentElement.style

beforeEach(() => {
  window.history.pushState({}, '', '/?__designPreview=1')
  Object.defineProperty(window, 'opener', { value: { postMessage: vi.fn() }, configurable: true })
})

afterEach(() => {
  cleanup()
  root().cssText = ''
  Object.defineProperty(window, 'opener', { value: null, configurable: true })
  window.history.pushState({}, '', '/')
})

describe('DesignPreviewBridge', () => {
  it('applies the draft theme variables to the page root', () => {
    render(<DesignPreviewBridge />)

    sendTheme({ '--color-bg': '#112233' })

    expect(root().getPropertyValue('--color-bg')).toBe('#112233')
  })

  // TYN-352: the navbar colors are only in the map while they are set. When
  // Tynnell clears one the variable is simply absent from the next message,
  // so setting what arrived is not enough: the old value would stay on the
  // preview and the navbar would not go back to following the button colors.
  it('removes a navbar color from the page when a later draft no longer has it', () => {
    render(<DesignPreviewBridge />)
    sendTheme({ '--color-nav-bg': '#102030', '--color-nav-text': '#f0e0d0' })
    expect(root().getPropertyValue('--color-nav-bg')).toBe('#102030')

    sendTheme({ '--color-bg': '#112233' })

    expect(root().getPropertyValue('--color-nav-bg')).toBe('')
    expect(root().getPropertyValue('--color-nav-text')).toBe('')
  })

  it('keeps the other variables when it removes a cleared navbar color', () => {
    render(<DesignPreviewBridge />)
    sendTheme({ '--color-bg': '#112233', '--color-nav-bg': '#102030' })

    sendTheme({ '--color-bg': '#112233' })

    expect(root().getPropertyValue('--color-bg')).toBe('#112233')
  })

  it('does nothing for a real visitor (no preview flag)', () => {
    window.history.pushState({}, '', '/')
    render(<DesignPreviewBridge />)

    sendTheme({ '--color-bg': '#112233' })

    expect(root().getPropertyValue('--color-bg')).toBe('')
  })
})
