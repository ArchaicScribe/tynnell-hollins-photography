// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { ApplyPhotoTreatment } from './ApplyPhotoTreatment'

// The photo colour treatment is baked into each photo's web renditions when it is
// processed. Photos uploaded before a change keep their old look until they are
// reprocessed, so /design offers "Apply to all photos": it rebuilds every photo's
// sizes from the original through the existing admin route, one photo at a time
// (each request stays well inside the serverless time limit).

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

type Call = { url: string; body?: unknown }

function stubFetch(ids: number[], failing: number[] = [], upToDate: number[] = []) {
  const calls: Call[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: { method?: string; body?: string }) => {
      calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined })
      if (url.startsWith('/api/photos')) return { ok: true, json: async () => ({ docs: ids.map((id) => ({ id })) }) }
      const id = JSON.parse(init!.body!).id
      return failing.includes(id)
        ? { ok: false, status: 500, json: async () => ({ error: 'sharp could not read it' }) }
        : { ok: true, json: async () => (upToDate.includes(id) ? { ok: true, id, skipped: true } : { ok: true, id }) }
    }),
  )
  return calls
}

describe('Apply to all photos', () => {
  it('rebuilds every photo one at a time, in order, through the admin route', async () => {
    const calls = stubFetch([3, 1, 2])
    render(<ApplyPhotoTreatment />)

    fireEvent.click(screen.getByRole('button', { name: /Apply to all photos/ }))

    await waitFor(() => expect(screen.getByText(/Done: 3 of 3 photos/)).toBeTruthy())
    const posts = calls.filter((c) => c.url === '/api/admin/regenerate-photo-sizes')
    expect(posts.map((c) => (c.body as { id: number }).id)).toEqual([3, 1, 2])
  })

  it('shows progress while it works and stops the button being pressed twice', async () => {
    const release: (() => void)[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.startsWith('/api/photos')) return { ok: true, json: async () => ({ docs: [{ id: 1 }, { id: 2 }] }) }
        await new Promise<void>((r) => release.push(r))
        return { ok: true, json: async () => ({ ok: true }) }
      }),
    )
    render(<ApplyPhotoTreatment />)

    fireEvent.click(screen.getByRole('button', { name: /Apply to all photos/ }))

    await waitFor(() => expect(screen.getByText(/Processing photo 1 of 2/)).toBeTruthy())
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true)
    release[0]()
    await waitFor(() => expect(screen.getByText(/Processing photo 2 of 2/)).toBeTruthy())
    release[1]()
    await waitFor(() => expect(screen.getByText(/Done: 2 of 2 photos/)).toBeTruthy())
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(false)
  })

  it('keeps going past a photo that fails, and says which one', async () => {
    stubFetch([1, 2, 3], [2])
    render(<ApplyPhotoTreatment />)

    fireEvent.click(screen.getByRole('button', { name: /Apply to all photos/ }))

    await waitFor(() => expect(screen.getByText(/Done: 2 of 3 photos/)).toBeTruthy())
    expect(screen.getByText(/Photo 2 failed: sharp could not read it/)).toBeTruthy()
  })

  it('does not start twice when clicked twice before the screen updates', async () => {
    const calls = stubFetch([1])
    render(<ApplyPhotoTreatment />)
    const button = screen.getByRole('button', { name: /Apply to all photos/ })

    fireEvent.click(button)
    fireEvent.click(button)

    await waitFor(() => expect(screen.getByText(/Done: 1 of 1 photos/)).toBeTruthy())
    expect(calls.filter((c) => c.url.startsWith('/api/photos')).length).toBe(1)
    expect(calls.filter((c) => c.url === '/api/admin/regenerate-photo-sizes').length).toBe(1)
  })

  it('is blocked while there are unpublished changes, because the server uses the published setting', () => {
    const calls = stubFetch([1])
    render(<ApplyPhotoTreatment blocked />)

    expect((screen.getByRole('button', { name: /Apply to all photos/ }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/Publish your changes first/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Apply to all photos/ }))
    expect(calls.length).toBe(0)
  })

  it('reports a failure to list the photos instead of hanging', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })))
    render(<ApplyPhotoTreatment />)

    fireEvent.click(screen.getByRole('button', { name: /Apply to all photos/ }))

    await waitFor(() => expect(screen.getByText(/Could not list your photos/)).toBeTruthy())
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(false)
  })

  // Photos record what they were last finished with, so a run that was interrupted, or a
  // second click with nothing changed, only does the photos that need it.
  it('asks the server to skip photos already at the current look', async () => {
    const calls = stubFetch([1, 2])
    render(<ApplyPhotoTreatment />)

    fireEvent.click(screen.getByRole('button', { name: /Apply to all photos/ }))

    await waitFor(() => expect(screen.getByText(/Done: 2 of 2 photos/)).toBeTruthy())
    const posts = calls.filter((c) => c.url === '/api/admin/regenerate-photo-sizes')
    expect(posts.every((c) => (c.body as { onlyIfStale?: boolean }).onlyIfStale === true)).toBe(true)
  })

  it('says how many photos were already up to date', async () => {
    stubFetch([1, 2, 3], [], [2, 3])
    render(<ApplyPhotoTreatment />)

    fireEvent.click(screen.getByRole('button', { name: /Apply to all photos/ }))

    await waitFor(() => expect(screen.getByText(/Done: 3 of 3 photos \(2 already up to date\)/)).toBeTruthy())
  })

  it('does not mention up-to-date photos when there were none', async () => {
    stubFetch([1, 2])
    render(<ApplyPhotoTreatment />)

    fireEvent.click(screen.getByRole('button', { name: /Apply to all photos/ }))

    await waitFor(() => expect(screen.getByText(/Done: 2 of 2 photos/)).toBeTruthy())
    expect(screen.queryByText(/already up to date/)).toBeNull()
  })
})
