import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPayload } from 'payload'
import config from '@payload-config'
import { EMAIL_FROM, CONTACT_EMAIL } from '@/app/lib/constants'
import { oooReturnNotificationEmailHtml } from '@/app/lib/emails'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // Guard against a missing CRON_SECRET: without this check, an unset secret
  // would make the expected header the literal string "Bearer undefined",
  // which a caller could trivially supply to bypass auth.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron/ooo-return-notify] CRON_SECRET is not set; refusing request')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
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

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: process.env.CONTACT_TO_EMAIL ?? CONTACT_EMAIL,
      subject: `You're back: ${range.internalLabel ?? 'OOO period'} has ended`,
      html: oooReturnNotificationEmailHtml({
        internalLabel: range.internalLabel ?? 'OOO period',
        returnDate: returnDateStr,
      }),
    })

    if (result.error) {
      console.error('[cron/ooo-return-notify] email send failed:', JSON.stringify(result.error))
      continue
    }

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
