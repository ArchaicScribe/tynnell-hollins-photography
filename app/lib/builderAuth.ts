import { NextResponse } from 'next/server'
import { getPayload, type Payload } from 'payload'
import { headers } from 'next/headers'
import payloadConfig from '@payload-config'

// Shared auth gate for the builder API routes (TYN-216+). Returns the
// authenticated Payload instance, or a 401 NextResponse the caller returns
// as-is. Usage:
//   const auth = await requireBuilderUser()
//   if (auth instanceof NextResponse) return auth
//   const { payload } = auth
export async function requireBuilderUser(): Promise<{ payload: Payload } | NextResponse> {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return { payload }
}
