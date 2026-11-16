import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isSafeLink } from '@/app/lib/safeLink'

// Public, read-only readiness check for the builder's Email Signup block
// (app/builder/puck.config.tsx). A Freebie sign-up with no guide link would
// take an address and send nothing, so the block stays hidden until this says
// the link is set. It mirrors /api/subscribe's own rule (a non-empty, safe
// link) and returns ONLY a boolean: the link itself never leaves the server,
// which is why it is not a block field. Any failure answers "not ready".
export async function GET() {
  try {
    const payload = await getPayload({ config })
    const site = await payload.findGlobal({ slug: 'site-config' })
    const link = (site.freebieUrl ?? '').trim()
    return NextResponse.json({ ready: Boolean(link) && isSafeLink(link) })
  } catch (e) {
    console.error('[public-freebie-ready] could not read the freebie settings:', e)
    return NextResponse.json({ ready: false })
  }
}
