import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

// Nothing set a weight on headings, so every h1 to h6 fell back to the browser's bold (700).
// The site serves Cormorant Garamond in 300 to 600 only, so the browser faked a bolder 700
// from the 600 face (found 2026-11-23 comparing against Rising Roots, whose headings are a
// light serif at weight 400). One base rule in the site stylesheet gives every heading a
// light weight; a component that wants something else still wins, because its class is more
// specific than an element selector.

const css = readFileSync(path.resolve(__dirname, 'globals.css'), 'utf8')
const norm = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim()

// The declarations of every top-level rule whose selector list contains `selector`.
function bodyOf(selector: string): string {
  let body = ''
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (norm(match[1]).split(',').map((s) => s.trim()).includes(selector)) body += match[2]
  }
  return body
}

describe('heading weight', () => {
  it.each(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])('%s has an explicit weight rather than the browser default bold', (tag) => {
    expect(bodyOf(tag)).toMatch(/font-weight:/)
  })

  it('is a light weight the serif is actually shipped in, never bold', () => {
    const weight = bodyOf('h1').match(/font-weight:\s*var\(--heading-weight,\s*(\d+)\)/)?.[1]
    expect(weight).toBeDefined()
    expect(Number(weight)).toBeGreaterThanOrEqual(300)
    expect(Number(weight)).toBeLessThanOrEqual(500)
  })

  it('is one rule for all six levels, so they cannot drift apart', () => {
    const weights = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => bodyOf(tag).match(/font-weight:[^;]+/)?.[0])
    expect(new Set(weights).size).toBe(1)
  })
})
