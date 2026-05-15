import { NextRequest, NextResponse } from 'next/server'

async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(request: NextRequest) {
  // DEV BYPASS — remove before merging to pipeline
  const host = request.headers.get('host') ?? ''
  if (host.startsWith('localhost')) return NextResponse.next()

  const basicAuth = request.headers.get('authorization')

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    const userHash = await sha256(user)
    const pwdHash  = await sha256(pwd)

    if (
      userHash === process.env.STUDIO_USER_HASH &&
      pwdHash  === process.env.STUDIO_PASSWORD_HASH
    ) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Access denied', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Studio"',
    },
  })
}

export const config = {
  matcher: '/studio/:path*',
}
