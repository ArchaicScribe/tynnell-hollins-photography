import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/app/lib/builderAuth'
import { cleanMenuCards } from '@/app/lib/menuCards'
import { isSafeLink } from '@/app/lib/safeLink'

// Persist Site Settings (TYN-313). Admin-only. Business name/tagline/contact
// info/social links surface across the whole (site) layout (nav, footer,
// contact page, homepage), so revalidate the entire layout tree rather than
// guessing at individual routes.
export const dynamic = 'force-dynamic'

const FIELDS = [
  'title',
  'tagline',
  'email',
  'phone',
  'instagramUrl',
  'facebookUrl',
  'tiktokUrl',
  'pinterestUrl',
  'freebieTitle',
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
  // The menu cards' links appear on every public page, so they are cleaned
  // (unsafe links dropped, at most two cards) before they reach the database.
  if ('menuCards' in body) data.menuCards = cleanMenuCards(body.menuCards)
  // The freebie link is emailed to every Freebie signup, so only a site page
  // or an https link is stored; anything else is saved as empty.
  if ('freebieUrl' in body) {
    const link = typeof body.freebieUrl === 'string' ? body.freebieUrl.trim() : ''
    data.freebieUrl = link && isSafeLink(link) ? link : ''
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  try {
    await payload.updateGlobal({ slug: 'site-config', data })
  } catch (err) {
    console.error('[site-settings/save] failed to save site config:', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }

  try {
    revalidatePath('/', 'layout')
  } catch {
    // No-op outside a request scope.
  }

  return NextResponse.json({ ok: true })
}
