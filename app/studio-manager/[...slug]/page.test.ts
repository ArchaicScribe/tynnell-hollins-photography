import { describe, it, expect, vi, beforeEach } from 'vitest'

const redirectMock = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}))

const { default: StudioManagerSubPage } = await import('./page')

function call(slug: string[]) {
  return StudioManagerSubPage({ params: Promise.resolve({ slug }) })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Studio Manager catch-all route - Projects', () => {
  it('redirects /studio-manager/projects to the real admin board', async () => {
    await call(['projects'])
    expect(redirectMock).toHaveBeenCalledExactlyOnceWith('/admin/collections/projects')
  })

  it('redirects /studio-manager/projects/new to the admin create form', async () => {
    await call(['projects', 'new'])
    expect(redirectMock).toHaveBeenCalledExactlyOnceWith('/admin/collections/projects/create')
  })

  it('redirects /studio-manager/projects/:id to the admin edit view for that id', async () => {
    await call(['projects', '42'])
    expect(redirectMock).toHaveBeenCalledExactlyOnceWith('/admin/collections/projects/42')
  })
})

describe('Studio Manager catch-all route - unbuilt sections', () => {
  it.each([
    ['contacts'],
    ['payments'],
    ['inbox'],
    ['documents'],
    ['templates'],
  ])('falls back to /studio-manager for %s (no backing collection yet)', async (section) => {
    await call([section])
    expect(redirectMock).toHaveBeenCalledExactlyOnceWith('/studio-manager')
  })

  it('falls back to /studio-manager for an unknown slug', async () => {
    await call(['something-unexpected'])
    expect(redirectMock).toHaveBeenCalledExactlyOnceWith('/studio-manager')
  })
})
