import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
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
    // Read the slug before deleting - the public page now uses ISR (TYN-290),
    // so a deleted page's cached render must be explicitly invalidated or it
    // would keep serving until the 120s window lapses.
    const page = await payload.findByID({ collection: 'pages', id, depth: 0 }).catch(() => null)
    await payload.delete({ collection: 'pages', id })
    if (page?.slug) revalidatePath(`/${page.slug}`)
  } catch (err) {
    console.error('[builder/delete] failed to delete page:', err)
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
