import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/app/lib/builderAuth'

// Persist Gallery Presets (TYN-323). Admin-only. These only affect galleries
// created from this point forward via the Galleries collection's create hook
// (collections/Galleries.ts) - no public page reads this, so no revalidation
// is needed.
export const dynamic = 'force-dynamic'

const FIELDS = [
  'defaultCategory',
  'defaultStatus',
  'defaultTapedStyle',
  'defaultFeatured',
  'defaultAllowDownload',
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
  // An empty string means "no default category" - store as null, not ''.
  if (data.defaultCategory === '') data.defaultCategory = null

  try {
    await payload.updateGlobal({ slug: 'gallery-presets', data })
  } catch (err) {
    console.error('[gallery-presets/save] failed to save presets:', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
