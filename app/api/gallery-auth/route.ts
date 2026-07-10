import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createHmac, timingSafeEqual } from 'crypto'
import bcrypt from 'bcryptjs'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getClientIp, safeLimit } from '@/app/lib/ratelimit'

// 10 attempts per IP per 15 minutes to slow brute-force attacks
const galleryAuthRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '15 m'),
  prefix: 'rl:gallery-auth',
})

function makeToken(slug: string, passwordHash: string): string {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET env var is required')
  return createHmac('sha256', secret).update(`${slug}:${passwordHash}`).digest('hex')
}

export async function POST(req: NextRequest) {
  const { success } = await safeLimit(galleryAuthRatelimit, getClientIp(req))
  if (!success) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  let body: { slug?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { slug, password } = body

  if (!slug || !password) {
    return NextResponse.json({ error: 'Missing slug or password' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  let docs: unknown[]
  try {
    ;({ docs } = await payload.find({
      collection: 'galleries',
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
    }))
  } catch (err) {
    console.error('[gallery-auth] failed to look up gallery:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gallery = docs[0] as any
  if (!gallery || !gallery.isPasswordProtected || typeof gallery.password !== 'string') {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  // Support both bcrypt hashes (new) and plaintext (legacy, until re-saved).
  // The plaintext branch uses timingSafeEqual rather than === so a legacy
  // password can't be guessed character-by-character via response timing.
  const storedPassword: string = gallery.password
  const isHashed = storedPassword.startsWith('$2')
  const valid = isHashed
    ? await bcrypt.compare(password, storedPassword)
    : (() => {
        const a = Buffer.from(password)
        const b = Buffer.from(storedPassword)
        return a.length === b.length && timingSafeEqual(a, b)
      })()

  if (!valid) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const token = makeToken(slug, storedPassword)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(`gauth_${slug}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: `/portfolio/${slug}`,
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
