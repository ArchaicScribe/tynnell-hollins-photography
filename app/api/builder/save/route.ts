import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import payloadConfig from '@payload-config'

// Persist the Puck builder document to the `builder` global (TYN-214 POC).
// Auth-gated: only logged-in Payload users may publish.
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let data: unknown
  try {
    const body = await request.json()
    data = body?.data
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'Missing builder data' }, { status: 400 })
  }

  await payload.updateGlobal({ slug: 'builder', data: { data } })
  return NextResponse.json({ ok: true })
}
