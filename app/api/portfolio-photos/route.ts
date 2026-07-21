import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'

// Public, read-only, category-scoped photo listing for the builder's
// PortfolioGrid block (app/builder/puck.config.tsx). Deliberately NOT the
// same as Payload's auto-generated `/api/photos` REST route - that route
// requires auth (Photos has no public `read` access) and would return every
// field on every photo. This route uses the local API server-side (same
// zero-HTTP-overhead query app/(site)/portfolio/[category]/page.tsx already
// runs) and only ever returns the handful of fields a public grid needs -
// the same data already visible on the hardcoded category pages today, not
// a new exposure.
const VALID_CATEGORIES = ['weddings', 'portraits', 'families', 'couples', 'brands'] as const

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category')
  if (!category || !(VALID_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ photos: [] })
  }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'photos',
    where: { category: { equals: category } },
    sort: 'displayOrder',
    depth: 0,
    limit: 500,
  })

  const photos = docs
    .filter((p) => p.url)
    .map((p) => {
      const photo = p as Photo
      return {
        id: String(photo.id),
        title: photo.title,
        alt: photo.alt ?? null,
        caption: photo.caption ?? null,
        imageUrl: photo.sizes?.card?.url ?? photo.url ?? null,
        fullUrl: photo.sizes?.hero?.url ?? photo.url ?? null,
      }
    })

  return NextResponse.json({ photos })
}
