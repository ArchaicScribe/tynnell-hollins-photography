import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// jsdom has no layout, so the sticky layouts (Sticky Panels, the sticky
// testimonials photo, sections with "slide over the one before") can only be
// guarded here, at the CSS that breaks them.
//
// `overflow-x: hidden` on html and body makes <body> a scroll container that
// never scrolls (its overflow-y computes to auto). Every position: sticky
// element inside it then sticks to body instead of the screen, which means it
// never sticks at all. `overflow-x: clip` hides sideways overflow the same way
// without creating a scroll container.
const css = readFileSync(path.join(__dirname, 'globals.css'), 'utf8')

describe('app/(site)/globals.css', () => {
  it('never turns html or body into a scroll container, which would stop every sticky layout from sticking', () => {
    const rootRules = [...css.matchAll(/(^|})\s*([^{}]*\b(?:html|body)\b[^{}]*)\{([^}]*)\}/g)]
      .filter(([, , selector]) => selector.split(',').some((s) => /^(html|body)$/.test(s.trim())))
      .map(([, , , body]) => body)

    expect(rootRules.length).toBeGreaterThan(0)
    for (const body of rootRules) {
      expect(body).not.toMatch(/overflow(-x|-y)?\s*:\s*(hidden|auto|scroll)/)
    }
  })
})
