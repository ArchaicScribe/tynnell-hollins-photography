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

  await payload.delete({ collection: 'pages', id })
  return NextResponse.json({ ok: true })
}
