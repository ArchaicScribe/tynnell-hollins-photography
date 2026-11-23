import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

// iOS Safari zooms the whole page when a form field under 16px is focused, and does not
// zoom back. Every field on the Contact and inquiry forms was 14px, so tapping one threw a
// phone visitor into a zoomed-in page on the booking path (found 2026-11-20). One rule in
// the site stylesheet keeps every field at 16px on phones and touch devices; the component
// stylesheets set smaller sizes with higher specificity, hence !important.

const css = readFileSync(path.resolve(__dirname, 'globals.css'), 'utf8')

describe('form fields on a phone', () => {
  const block = css.match(/@media\s*\(max-width:\s*767px\),\s*\(pointer:\s*coarse\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

  it('are 16px on narrow screens and on touch devices', () => {
    expect(block).toMatch(/font-size:\s*16px\s*!important/)
  })

  it('cover text inputs, selects and textareas, but not checkboxes, radios or buttons', () => {
    expect(block).toMatch(/\bselect\b/)
    expect(block).toMatch(/\btextarea\b/)
    expect(block).toMatch(/\binput:not\(\[type='checkbox'\]\)/)
    expect(block).toMatch(/:not\(\[type='radio'\]\)/)
    expect(block).toMatch(/:not\(\[type='submit'\]\)/)
  })
})
