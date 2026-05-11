import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const body = `User-agent: *
Disallow: /studio
Disallow: /api/
Allow: /
`
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
