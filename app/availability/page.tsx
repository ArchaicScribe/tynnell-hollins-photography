import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import payloadConfig from '@payload-config'
import type { Availability } from '@/payload-types'
import { AvailabilityEditorClient } from './AvailabilityEditorClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Availability' }

export default async function AvailabilityPage() {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const data = await payload.findGlobal({ slug: 'availability' }) as Availability
  const blockedRanges = Array.isArray(data?.blockedRanges) ? data.blockedRanges : []

  return <AvailabilityEditorClient initialRanges={blockedRanges} />
}
