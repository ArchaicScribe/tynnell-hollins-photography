import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (process.env.COMING_SOON !== 'true') return NextResponse.next()
  if (pathname.startsWith('/coming-soon')) return NextResponse.next()
  if (pathname.startsWith('/admin')) return NextResponse.next()
  if (pathname.startsWith('/api')) return NextResponse.next()
  if (pathname.startsWith('/book')) return NextResponse.next()
  if (pathname.startsWith('/_next')) return NextResponse.next()
  if (pathname.startsWith('/favicon')) return NextResponse.next()

  return NextResponse.redirect(new URL('/coming-soon', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|svg|webp|woff2?|ttf)).*)'],
}
