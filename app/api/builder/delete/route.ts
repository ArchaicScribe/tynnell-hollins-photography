import { NextResponse } from 'next/server'
import { requireBuilderUser } from '@/app/lib/builderAuth'

// Delete a builder page (TYN-219). Auth-gated.
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = await requireBuilderUser()
  if (auth instanceof NextResponse) return auth
  const { payload } = auth

  let id: number | string | undefined
  try {
    const body = await request.json()
    id = body?.id
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (id === undefined || id === null || id === '') {
    return NextResponse.json({ error: 'Missing page id' }, { status: 400 })
  }

  try {
    await payload.delete({ collection: 'pages', id })
  } catch (err) {
    console.error('[builder/delete] failed to delete page:', err)
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
