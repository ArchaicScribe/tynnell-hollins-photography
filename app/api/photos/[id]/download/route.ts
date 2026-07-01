import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

// Verify the gallery auth cookie for password-protected galleries.
function verifyToken(slug: string, passwordHash: string, token: string): boolean {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) return false
  try {
    const expected = createHmac('sha256', secret).update(`${slug}:${passwordHash}`).digest('hex')
    const a = Buffer.from(token)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

type Props = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Props) {
  const { id } = await params
  const photoId = Number(id)
  if (!photoId || isNaN(photoId)) {
    return new NextResponse('Not found', { status: 404 })
  }

  // The gallery slug is required, not optional - it's what gates every
  // permission check below. Without it, this route would serve any photo by
  // ID with zero authorization, bypassing allowDownload, password protection,
  // and draft status entirely (photo IDs are small sequential integers, so
  // that would allow enumerating and downloading the entire photo library).
  const slug = req.nextUrl.searchParams.get('gallery')
  if (!slug) {
    return new NextResponse('Missing gallery parameter', { status: 400 })
  }

  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'galleries',
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
  })
  const gallery = docs[0]
  if (!gallery) return new NextResponse('Not found', { status: 404 })
  if (!gallery.allowDownload) return new NextResponse('Downloads not enabled', { status: 403 })
  if (gallery.status === 'draft') return new NextResponse('Not found', { status: 404 })

  // Password-protected gallery: check cookie.
  if (gallery.isPasswordProtected && gallery.password) {
    const cookieStore = await cookies()
    const token = cookieStore.get(`gauth_${slug}`)?.value
    if (!token || !verifyToken(slug, gallery.password, token)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  // Verify the requested photo actually belongs to this gallery - otherwise a
  // request could pair an arbitrary photo ID with the slug of any other
  // gallery that has allowDownload enabled, and download a photo from a
  // completely unrelated (possibly private, password-protected) gallery.
  const isMember = Array.isArray(gallery.photos) && gallery.photos.some(row => {
    const rowPhotoId = typeof row.photo === 'number' ? row.photo : row.photo?.id
    return rowPhotoId === photoId
  })
  if (!isMember) return new NextResponse('Not found', { status: 404 })

  // Look up the photo.
  let photo: Photo
  try {
    photo = await payload.findByID({ collection: 'photos', id: photoId, depth: 0 }) as Photo
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
  if (!photo) return new NextResponse('Not found', { status: 404 })

  // Proxy the photo from R2 so the browser receives it with a download filename.
  const sourceUrl = photo.url
  if (!sourceUrl) return new NextResponse('Photo has no URL', { status: 404 })

  const upstream = await fetch(sourceUrl)
  if (!upstream.ok) return new NextResponse('Failed to fetch photo', { status: 502 })

  const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
  const ext = contentType.split('/')[1]?.split(';')[0] ?? 'jpg'
  // Strip quotes so a crafted filename can't break out of the header value.
  const filename = (photo.filename ?? `photo-${photoId}.${ext}`).replace(/"/g, '')

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
