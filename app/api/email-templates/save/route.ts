import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/app/lib/builderAuth'

// Persist Email Templates (TYN-324). Admin-only. No public page reads this,
// so no revalidation is needed - it only affects emails sent going forward.
export const dynamic = 'force-dynamic'

const FIELDS = [
  'shareSubject',
  'shareHeading',
  'shareBody',
  'shareButtonLabel',
  'reminderSubject',
  'reminderHeading',
  'reminderBody',
  'reminderButtonLabel',
  'reminderDaysBefore',
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
    await payload.updateGlobal({ slug: 'email-templates', data })
  } catch (err) {
    console.error('[email-templates/save] failed to save templates:', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
