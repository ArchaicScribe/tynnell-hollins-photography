import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createHmac } from 'crypto'

function makeToken(slug: string, password: string): string {
  const secret = process.env.PAYLOAD_SECRET ?? 'dev-secret'
  return createHmac('sha256', secret).update(`${slug}:${password}`).digest('hex')
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { slug?: string; password?: string }
  const { slug, password } = body

  if (!slug || !password) {
    return NextResponse.json({ error: 'Missing slug or password' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'galleries',
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gallery = docs[0] as any
  if (!gallery || !gallery.isPasswordProtected) {
    return NextResponse.json({ error: 'Gallery not found or not protected' }, { status: 404 })
  }

  if (!gallery.password || gallery.password !== password) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const token = makeToken(slug, password)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(`gauth_${slug}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/portfolio/${slug}`,
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
