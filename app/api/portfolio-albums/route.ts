import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'

// Public, read-only, category-scoped album listing for the builder's
// AlbumGrid block (app/builder/puck.config.tsx) - the sibling of
// /api/portfolio-photos for the same reason: Payload's own /api/galleries
// REST route has no public `read` access (confirmed - a direct request
// returns 403). This route runs the same local-API query
// app/(site)/portfolio/weddings/page.tsx already used before its own album
// listing was extracted into AlbumGrid, and only returns what a public
// album grid needs to display (cover, a few preview thumbnails, title,
// photo count) - not the full gallery document.
const VALID_CATEGORIES = ['weddings', 'portraits', 'families', 'couples', 'brands'] as const

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category')
  if (!category || !(VALID_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ albums: [] })
  }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'galleries',
    where: {
      and: [
        { category: { equals: category } },
        { status: { not_equals: 'draft' } },
      ],
    },
    sort: 'displayOrder',
    depth: 1,
    limit: 100,
  })

  const albums = docs.map((gallery) => {
    const cover = typeof gallery.coverPhoto === 'object' && gallery.coverPhoto !== null
      ? gallery.coverPhoto as Photo
      : null
    const coverUrl = cover?.sizes?.card?.url ?? cover?.url ?? null
    const photoCount = Array.isArray(gallery.photos) ? gallery.photos.length : 0

    const previewUrls = (Array.isArray(gallery.photos) ? gallery.photos.slice(0, 5) : [])
      .map((item) => {
        const p = typeof item.photo === 'object' && item.photo !== null ? item.photo as Photo : null
        return p?.sizes?.card?.url ?? p?.url ?? null
      })
      .filter((u): u is string => u !== null)

    return {
      id: gallery.id,
      slug: gallery.slug ?? '',
      title: gallery.title,
      coverUrl,
      coverAlt: cover?.alt ?? gallery.title,
      previewUrls,
      photoCount,
    }
  })

  return NextResponse.json({ albums })
}
