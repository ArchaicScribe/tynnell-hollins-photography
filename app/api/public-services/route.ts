import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// Public, read-only service listing for the builder's LiveServices block
// (app/builder/puck.config.tsx). Deliberately NOT Payload's auto-generated
// `/api/services` REST route - that requires auth. Runs the same local-API
// query the hardcoded /services page already uses (sort: displayOrder, all
// services, no filter) and only returns the fields a public grid needs -
// the same data already visible on that page today, not a new exposure.
export async function GET() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'services',
    sort: 'displayOrder',
    depth: 0,
    limit: 50,
  })

  const services = docs.map((s) => ({
    id: s.id,
    eyebrow: s.eyebrow ?? null,
    title: s.title,
    price: s.price ?? null,
    description: s.description ?? null,
    features: (s.features ?? []).map((f) => f.feature),
    depositAmount: s.depositAmount ?? null,
  }))

  return NextResponse.json({ services })
}
