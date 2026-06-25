import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  })

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  )

  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
    sameSite: 'lax',
  })

  return response
}
