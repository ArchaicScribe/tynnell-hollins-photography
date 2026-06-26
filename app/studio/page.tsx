import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import payloadConfig from '@payload-config'
import { StudioClient } from './StudioClient'

export const dynamic = 'force-dynamic'

export default async function StudioPage() {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const [galleriesRes, photosRes] = await Promise.all([
    payload.find({ collection: 'galleries', limit: 6, sort: '-updatedAt', depth: 1 }),
    payload.find({ collection: 'photos', limit: 8, sort: '-updatedAt', depth: 0 }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const galleries = galleriesRes.docs as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const photos = photosRes.docs as any[]

  return (
    <StudioClient
      userName={user.email ?? ''}
      galleries={galleries}
      photos={photos}
    />
  )
}
