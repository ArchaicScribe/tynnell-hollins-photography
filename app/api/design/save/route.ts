import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/app/lib/builderAuth'

// Persist the site-wide Design theme (TYN-314). Admin-only. The (site) root
// layout reads this global fresh on every request, so publishing here takes
// effect on the next page load - no separate cache invalidation needed beyond
// revalidating the layout-level cache.
export const dynamic = 'force-dynamic'

const FIELDS = [
  'logoUrl',
  'faviconUrl',
  'watermarkEnabled',
  'watermarkUrl',
  'headingFont',
  'bodyFont',
  'colorBg',
  'colorBgAccent',
  'colorHeading',
  'colorBody',
  'colorDetail',
  'colorBtnBg',
  'spacingScale',
  'buttonStyle',
  'animationsEnabled',
] as const

export async function POST(request: Request) {
  const auth = await requireAdminUser()
  if (auth instanceof NextResponse) return auth
  const { payload } = auth

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  for (const key of FIELDS) {
    if (key in body) data[key] = body[key]
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  try {
    await payload.updateGlobal({ slug: 'site-design', data })
  } catch (err) {
    console.error('[design/save] failed to save site design:', err)
    return NextResponse.json({ error: 'Failed to save design' }, { status: 500 })
  }

  try {
    revalidatePath('/', 'layout')
  } catch {
    // No-op outside a request scope.
  }

  return NextResponse.json({ ok: true })
}
