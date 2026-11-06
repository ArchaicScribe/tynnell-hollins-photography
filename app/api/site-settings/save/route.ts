import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/app/lib/builderAuth'
import { cleanMenuCards } from '@/app/lib/menuCards'
import { isSafeLink } from '@/app/lib/safeLink'
import { deleteR2Object, uploadedFreebieKey } from '@/app/lib/r2'

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
  // or an https link is stored. An unsafe link is ignored, keeping the one
  // already saved (blanking it would quietly stop every freebie email); an
  // empty box clears it.
  if ('freebieUrl' in body) {
    const link = typeof body.freebieUrl === 'string' ? body.freebieUrl.trim() : ''
    if (!link || isSafeLink(link)) data.freebieUrl = link
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  // When the guide link changes, remember the old one so its PDF can be
  // removed from storage once the new link is safely saved. A failed lookup
  // only skips the cleanup; it never blocks the save.
  let previousFreebieUrl = ''
  if ('freebieUrl' in data) {
    try {
      const current = await payload.findGlobal({ slug: 'site-config', depth: 0 })
      previousFreebieUrl = current?.freebieUrl ?? ''
    } catch (err) {
      console.error('[site-settings/save] could not read the saved freebie link:', err)
    }
  }

  try {
    await payload.updateGlobal({ slug: 'site-config', data })
  } catch (err) {
    console.error('[site-settings/save] failed to save site config:', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }

  // Delete only our own Site Settings uploads (files/<uuid>-name.pdf in R2),
  // never a guide hosted elsewhere or anything else in the bucket. The
  // settings are already saved, so a failed delete just leaves a stray file.
  const oldKey = previousFreebieUrl !== data.freebieUrl ? uploadedFreebieKey(previousFreebieUrl) : null
  if (oldKey) {
    try {
      await deleteR2Object(oldKey)
    } catch (err) {
      console.error('[site-settings/save] could not delete the replaced freebie PDF:', oldKey, err)
    }
  }

  try {
    revalidatePath('/', 'layout')
  } catch {
    // No-op outside a request scope.
  }

  return NextResponse.json({ ok: true })
}
