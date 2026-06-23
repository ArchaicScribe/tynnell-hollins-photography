import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const body = `User-agent: *
Disallow: /admin
Disallow: /api/
Disallow: /gallery-editor
Disallow: /builder
Allow: /

Sitemap: https://tynnellhollinsphotography.com/sitemap.xml
`
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
