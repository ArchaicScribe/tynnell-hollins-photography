import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import payloadConfig from '@payload-config'
import { AvailabilityEditorClient } from './AvailabilityEditorClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Availability' }

export default async function AvailabilityPage() {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await payload.findGlobal({ slug: 'availability' }) as any
  const blockedRanges = Array.isArray(data?.blockedRanges) ? data.blockedRanges : []

  return <AvailabilityEditorClient initialRanges={blockedRanges} />
}
