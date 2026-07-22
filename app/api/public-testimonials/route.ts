import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'

// Public, read-only testimonial listing for the builder's LiveTestimonials
// block (app/builder/puck.config.tsx). Deliberately NOT Payload's
// auto-generated `/api/testimonials` REST route - that requires auth. Runs
// the same local-API query the hardcoded /testimonials page already uses
// (sort: displayOrder, ALL testimonials, no "featured" filter - that flag
// only governs the homepage teaser, not this page) and only returns the
// fields a public list needs.
export async function GET() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'testimonials',
    sort: 'displayOrder',
    depth: 1,
    limit: 200,
  })

  const testimonials = docs.map((t) => {
    const photo = t.photo && typeof t.photo === 'object' ? t.photo as Photo : null
    return {
      id: t.id,
      sessionType: t.sessionType ?? null,
      clientName: t.clientName,
      quote: t.quote,
      photoUrl: photo?.sizes?.card?.url ?? photo?.sizes?.thumbnail?.url ?? photo?.url ?? null,
      photoWidth: photo?.sizes?.card?.width ?? photo?.sizes?.thumbnail?.width ?? photo?.width ?? null,
      photoHeight: photo?.sizes?.card?.height ?? photo?.sizes?.thumbnail?.height ?? photo?.height ?? null,
    }
  })

  return NextResponse.json({ testimonials })
}
