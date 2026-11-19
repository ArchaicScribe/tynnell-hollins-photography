import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

vi.mock('next/cache', () => ({ revalidatePath: () => {} }))

import { Pages } from './Pages'

// /portfolio/weddings, /portfolio/family and /portfolio/portraits redirect to the
// builder pages before routing, so promoting a page to one of them did nothing.
// They are no longer offered. The Site Editor keeps a hand-copied list of the
// same routes (its comment says "kept in sync by hand"), so this also pins the
// two together.

const field = (Pages.fields as { name?: string; options?: { value: string }[] }[]).find((f) => f.name === 'promotedRoute')
const offered = (field?.options ?? []).map((o) => o.value)

describe('promotable routes', () => {
  it('offers the routes that are still real, hand-coded pages', () => {
    expect(offered).toEqual(['about', 'portfolio', 'services', 'testimonials', 'contact', 'blog'])
  })

  it.each(['portfolio/portraits', 'portfolio/family', 'portfolio/weddings'])('no longer offers %s, which only redirects', (route) => {
    expect(offered).not.toContain(route)
  })

  it('matches the list the Site Editor copies by hand', () => {
    const source = readFileSync(path.resolve(__dirname, '../app/builder/SiteEditorClient.tsx'), 'utf8')
    const block = source.match(/const PROMOTABLE_ROUTES[^=]*=\s*\[([\s\S]*?)\n\]/)?.[1] ?? ''
    const copied = [...block.matchAll(/route:\s*'([^']+)'/g)].map((m) => m[1])

    expect(copied).toEqual(offered)
  })

  it('does not link the Site Editor sidebar to the redirected addresses', () => {
    const source = readFileSync(path.resolve(__dirname, '../app/builder/SiteEditorClient.tsx'), 'utf8')

    expect(source).not.toMatch(/href:\s*'\/portfolio\/(portraits|family|weddings)'/)
  })
})
