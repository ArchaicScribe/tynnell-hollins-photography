import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPayload } from 'payload'
import config from '@payload-config'
import { EMAIL_FROM, CONTACT_EMAIL } from '@/app/lib/constants'
import { oooReturnNotificationEmailHtml } from '@/app/lib/emails'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const availability = await payload.findGlobal({ slug: 'availability' })
  const ranges = availability.blockedRanges

  if (!Array.isArray(ranges) || ranges.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let sent = 0
  const updatedRanges = ranges.map((range) => ({ ...range }))

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i]
    if (!range.startDate || !range.endDate) continue
    if (range.notificationSent) continue

    const end = new Date(range.endDate)
    const bufferDays = range.applyReturnBuffer !== false ? (range.returnBufferDays ?? 2) : 0
    const returnDate = new Date(end)
    returnDate.setDate(returnDate.getDate() + bufferDays)
    returnDate.setHours(0, 0, 0, 0)

    if (today.getTime() !== returnDate.getTime()) continue

    const returnDateStr = returnDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    await resend.emails.send({
      from: EMAIL_FROM,
      to: process.env.CONTACT_TO_EMAIL ?? CONTACT_EMAIL,
      subject: `You're back — ${range.internalLabel ?? 'OOO period'} has ended`,
      html: oooReturnNotificationEmailHtml({
        internalLabel: range.internalLabel ?? 'OOO period',
        returnDate: returnDateStr,
      }),
    })

    updatedRanges[i] = { ...updatedRanges[i], notificationSent: true }
    sent++
  }

  if (sent > 0) {
    await payload.updateGlobal({
      slug: 'availability',
      data: { blockedRanges: updatedRanges },
    })
  }

  return NextResponse.json({ sent })
}
