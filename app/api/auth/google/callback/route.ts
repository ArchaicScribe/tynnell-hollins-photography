import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SignJWT } from 'jose'

export const runtime = 'nodejs'

const ALLOWED_EMAILS = new Set([
  'hello@tynnellhollinsphotography.com',
  'tynnellh@gmail.com',
  'xandermv2@gmail.com',
])

// Payload v3 default token expiration is 7200 seconds (2 hours)
const TOKEN_EXPIRATION_SECONDS = 7200

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = request.cookies.get('google_oauth_state')?.value
  const origin = process.env.APP_URL ?? request.nextUrl.origin

  const fail = (reason: string) => {
    console.error(`[google-sso] fail: ${reason}`)
    return NextResponse.redirect(new URL(`/admin/login?sso_error=${reason}`, origin))
  }

  if (!code || !state || !storedState || state !== storedState) {
    const reason = !code ? 'no_code' : !state ? 'no_state' : !storedState ? 'no_cookie' : 'state_mismatch'
    return fail(`invalid_state:${reason}`)
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json() as { id_token?: string; error?: string }

    if (!tokenRes.ok || !tokenData.id_token) {
      console.error('[google-sso] token exchange failed:', tokenData)
      return fail('token_exchange_failed')
    }

    const infoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenData.id_token}`
    )
    const userInfo = await infoRes.json() as {
      email?: string
      aud?: string
      email_verified?: string
    }

    if (
      !infoRes.ok ||
      userInfo.aud !== process.env.GOOGLE_CLIENT_ID ||
      userInfo.email_verified !== 'true'
    ) {
      return fail('invalid_token')
    }

    const rawEmail = userInfo.email ?? ''
    const email = rawEmail.toLowerCase()

    if (!ALLOWED_EMAILS.has(email)) {
      return fail('unauthorized')
    }

    const payload = await getPayload({ config })
    let { docs } = await payload.find({
      collection: 'users',
      where: { email: { equals: rawEmail } },
      limit: 1,
    })

    if (!docs.length) {
      const result = await payload.find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
      })
      docs = result.docs
    }

    if (!docs.length) return fail('user_not_found')

    const user = docs[0]

    // Payload v3 with useSessions:true requires a sid claim in the JWT that matches
    // a session record in the DB. payload.db.updateOne bypasses the sessions field's
    // access: { update: () => false } restriction, mirroring addSessionToUser internally.
    const sid = crypto.randomUUID()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + TOKEN_EXPIRATION_SECONDS * 1000)

    type SessionEntry = { id: string; createdAt: Date; expiresAt: Date }
    const userAny = user as unknown as { sessions?: SessionEntry[] }
    const currentSessions: SessionEntry[] = Array.isArray(userAny.sessions)
      ? userAny.sessions.filter((s) => s.expiresAt && new Date(s.expiresAt) > now)
      : []

    currentSessions.push({ id: sid, createdAt: now, expiresAt })

    await payload.db.updateOne({
      id: user.id,
      collection: 'users',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...(user as any), sessions: currentSessions, updatedAt: null },
      returning: false,
    })

    // payload.secret = sha256(PAYLOAD_SECRET).hex.slice(0,32) — NOT the raw env var.
    // Using process.env.PAYLOAD_SECRET directly would produce a mismatched signature.
    const secretKey = new TextEncoder().encode(payload.secret)
    const issuedAt = Math.floor(Date.now() / 1000)
    const exp = issuedAt + TOKEN_EXPIRATION_SECONDS

    const token = await new SignJWT({
      id: user.id,
      collection: 'users',
      email: user.email,
      sid,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(issuedAt)
      .setExpirationTime(exp)
      .sign(secretKey)

    const response = NextResponse.redirect(new URL('/admin', origin))

    response.cookies.set('payload-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: TOKEN_EXPIRATION_SECONDS,
      path: '/',
      sameSite: 'lax',
    })

    response.cookies.delete('google_oauth_state')

    return response
  } catch (err) {
    console.error('[google-sso] callback error:', err)
    return fail('server_error')
  }
}
