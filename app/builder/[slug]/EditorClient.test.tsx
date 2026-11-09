// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import type { Data } from '@measured/puck'

// Puck measures layout and reads media queries the moment it is imported.
vi.hoisted(() => {
  const g = globalThis as Record<string, unknown>
  g.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  g.matchMedia = (media: string) => ({
    matches: false,
    media,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  })
})

import { EditorClient } from './EditorClient'

// Shaped like the live Home page: a root saved as `{}` (Puck rewrites it to
// `{ props: {} }` on load) and two blocks whose resolveData fetches live photos
// and testimonials into `resolved*` props as soon as the editor opens.
// Puck caches resolveData results by block id across mounts, so every test
// gets its own ids or later tests would never fetch.
let mounts = 0
function savedHome(): Data {
  mounts++
  return {
    root: {},
    content: [
      { type: 'PortfolioGrid', props: { id: `grid-${mounts}`, category: 'all' } },
      { type: 'LiveTestimonials', props: { id: `quotes-${mounts}`, stickyPhotoScroll: false } },
    ],
  }
}

const liveApi = vi.fn(async () =>
  new Response(JSON.stringify({ photos: [{ id: 1 }], testimonials: [{ id: 2, quote: 'Lovely' }] }), { status: 200 }),
)

beforeEach(() => {
  vi.stubGlobal('fetch', liveApi)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  liveApi.mockClear()
})

function openEditor() {
  return render(
    <EditorClient
      slug="home-builder"
      title="Home"
      published
      hasDraft={false}
      initialData={savedHome()}
      promotedRoute={null}
    />,
  )
}

// Both blocks have fetched and Puck has had a moment to report the result.
async function waitForLiveData() {
  await waitFor(() => expect(liveApi).toHaveBeenCalledTimes(2))
  await new Promise((r) => setTimeout(r, 300))
}

describe('EditorClient unsaved-changes tracking', () => {
  it('opening a page without editing it does not report unsaved changes', async () => {
    openEditor()
    await waitForLiveData()

    expect(screen.queryByText('Unsaved changes')).toBeNull()
    expect(screen.getByText('Live on site')).toBeTruthy()
  })

  it('opening a page without editing it does not arm the leave-site warning', async () => {
    const addListener = vi.spyOn(window, 'addEventListener')
    openEditor()
    await waitForLiveData()

    expect(addListener.mock.calls.filter(([type]) => type === 'beforeunload')).toEqual([])
    addListener.mockRestore()
  })
})
