import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import payloadConfig from '@payload-config'
import type { Availability } from '@/payload-types'
import { AvailabilityEditorClient, type Range } from './AvailabilityEditorClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Availability' }

export default async function AvailabilityPage() {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const data = await payload.findGlobal({ slug: 'availability' }) as Availability
  const blockedRanges: Range[] = (Array.isArray(data?.blockedRanges) ? data.blockedRanges : []).map(r => ({
    id: r.id ?? undefined,
    internalLabel: r.internalLabel,
    startDate: r.startDate,
    endDate: r.endDate,
    applyReturnBuffer: r.applyReturnBuffer ?? false,
    returnBufferDays: r.returnBufferDays ?? 0,
    customerMessage: r.customerMessage,
    notificationSent: r.notificationSent ?? undefined,
  }))

  return <AvailabilityEditorClient initialRanges={blockedRanges} />
}
