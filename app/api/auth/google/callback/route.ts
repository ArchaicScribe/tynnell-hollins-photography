import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SignJWT, jwtVerify } from 'jose'

export const runtime = 'nodejs'

const ALLOWED_EMAILS = new Set([
  'hello@tynnellhollinsphotography.com',
  'xandermv2@gmail.com',
])

// Payload v3 default token expiration is 7200 seconds (2 hours)
const TOKEN_EXPIRATION_SECONDS = 7200

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = request.cookies.get('google_oauth_state')?.value
  const origin = request.nextUrl.origin

  const fail = (reason: string) => {
    console.error(`[google-sso] fail: ${reason}`)
    return NextResponse.redirect(new URL(`/admin/login?sso_error=${reason}`, origin))
  }

  console.log(`[google-sso] callback code=${!!code} state=${state?.slice(0, 8)} storedState=${storedState?.slice(0, 8) ?? 'MISSING'}`)

  if (!code || !state || !storedState || state !== storedState) {
    const reason = !code ? 'no_code' : !state ? 'no_state' : !storedState ? 'no_cookie' : 'state_mismatch'
    return fail(`invalid_state:${reason}`)
  }

  try {
    // Exchange code for tokens
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
      console.error('Google token exchange failed:', tokenData)
      return fail('token_exchange_failed')
    }

    // Verify id_token with Google's tokeninfo endpoint
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

    console.log(`[google-sso] email from Google: ${rawEmail}`)

    if (!ALLOWED_EMAILS.has(email)) {
      return fail('unauthorized')
    }

    // Find the Payload user - try both the exact Google email and lowercase
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

    console.log(`[google-sso] user lookup found: ${docs.length} docs`)

    if (!docs.length) {
      return fail('user_not_found')
    }

    const user = docs[0]
    console.log(`[google-sso] creating session for user id=${user.id}`)

    // Payload v3 requires a session ID (sid) in the JWT, stored in the user's sessions array.
    // Without it, Payload's JWT strategy returns { user: null } even if the JWT signature is valid.
    const sid = crypto.randomUUID()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + TOKEN_EXPIRATION_SECONDS * 1000)

    // Use payload.db.updateOne directly - same pattern as Payload's internal addSessionToUser.
    // payload.update strips the sessions field (access.update = false) even with overrideAccess.
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

    // Diagnostic: read the user back to confirm sessions were actually persisted
    const readBack = await payload.findByID({ id: user.id, collection: 'users' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storedSessions = (readBack as any)?.sessions
    console.log(`[google-sso] sessions after updateOne: ${JSON.stringify(storedSessions)}`)
    console.log(`[google-sso] target sid=${sid}`)

    console.log(`[google-sso] session created sid=${sid}, signing token`)

    // Sign using jose (same library Payload v3 uses internally)
    const secretKey = new TextEncoder().encode(process.env.PAYLOAD_SECRET ?? '')
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

    // Self-verify using payload.secret (same key Payload's JWT strategy uses)
    const verifyKey = new TextEncoder().encode(payload.secret)
    try {
      const { payload: decoded } = await jwtVerify(token, verifyKey)
      console.log(`[google-sso] self-verify OK id=${decoded.id} sid=${decoded.sid} col=${decoded.collection}`)
    } catch (verifyErr) {
      console.error(`[google-sso] self-verify FAILED`, verifyErr)
    }
    console.log(`[google-sso] secret len: payload.secret=${payload.secret?.length} env=${(process.env.PAYLOAD_SECRET ?? '').length}`)

    console.log(`[google-sso] token signed, redirecting to /admin`)

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
    console.error('Google SSO callback error:', err)
    return fail('server_error')
  }
}
