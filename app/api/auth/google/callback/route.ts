import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SignJWT } from 'jose'

export const runtime = 'nodejs'

const ALLOWED_EMAILS = new Set([
  'hello@tynnellhollinsphotography.com',
  'xandermv2@gmail.com',
])

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

  if (!code || !state || !storedState || state !== storedState) {
    return fail('invalid_state')
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
    console.log(`[google-sso] signing token for user id=${user.id} email=${user.email}`)

    // Sign a JWT in the same format Payload uses internally
    const secret = new TextEncoder().encode(process.env.PAYLOAD_SECRET ?? '')
    const token = await new SignJWT({
      id: user.id,
      collection: 'users',
      email: user.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secret)

    console.log(`[google-sso] token signed, redirecting to /admin`)

    const response = NextResponse.redirect(new URL('/admin', origin))

    response.cookies.set('payload-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2, // 2 hours
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
