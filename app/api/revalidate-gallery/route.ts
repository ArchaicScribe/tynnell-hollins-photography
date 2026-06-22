import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import payloadConfig from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: payloadConfig })
    const { user } = await payload.auth({ headers: await headers() })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { slug } = (await req.json()) as { slug?: string }

    revalidatePath('/portfolio')
    if (slug) revalidatePath(`/portfolio/${slug}`)

    return NextResponse.json({ revalidated: true })
  } catch {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
