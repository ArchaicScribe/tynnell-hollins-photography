import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isValidEmail, isValidPhone, isValidSessionDate, escapeHtml, anyFieldTooLong, CONTACT_MAX_LENGTHS, MIN_LEAD_TIME_HOURS, MAX_BOOKING_MONTHS } from '@/app/lib/validation'
import { contactRatelimit, getClientIp } from '@/app/lib/ratelimit'
import { isAllowedOrigin } from '@/app/lib/cors'
import { inquiryEmailHtml, clientAcknowledgmentEmailHtml } from '@/app/lib/emails'
import { CONTACT_EMAIL, EMAIL_FROM, RATE_LIMIT_ERROR } from '@/app/lib/constants'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

// Compute the effective end of a blocked range, including optional return buffer
function blockedRangeEnd(endDate: string, applyBuffer: boolean, bufferDays: number): Date {
  const end = new Date(endDate)
  if (applyBuffer && bufferDays > 0) {
    end.setDate(end.getDate() + bufferDays)
  }
  end.setHours(23, 59, 59, 999)
  return end
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json()
  const { name, email, phone, contactPreference, sessionType, date, location, message, howHeard } = body

  const { success } = await contactRatelimit.limit(getClientIp(request))
  if (!success) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 429 })
  }

  if (!name || !email || !phone || !contactPreference || !sessionType || !date || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (anyFieldTooLong({ name, phone, contactPreference, sessionType, date, location, message, howHeard }, CONTACT_MAX_LENGTHS)) {
    return NextResponse.json({ error: 'One or more fields exceeds the maximum allowed length' }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: 'Please enter a valid phone number (at least 7 digits).' }, { status: 400 })
  }

  // Fetch booking settings and availability from the admin — fall back to
  // hardcoded defaults if the globals haven't been saved yet or the fetch fails
  let minLeadTimeHours = MIN_LEAD_TIME_HOURS
  let maxBookingMonths = MAX_BOOKING_MONTHS
  let blockedRanges: Array<{
    startDate?: string | null
    endDate?: string | null
    applyReturnBuffer?: boolean | null
    returnBufferDays?: number | null
    customerMessage?: string | null
  }> = []

  try {
    const payload = await getPayload({ config })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [bookingSettings, availability] = await Promise.all([
      payload.findGlobal({ slug: 'booking-settings' as any }),
      payload.findGlobal({ slug: 'availability' as any }),
    ]) as [any, any] // payload-types.ts needs regenerating after deploy to add these globals

    if (typeof bookingSettings?.minLeadTimeHours === 'number') {
      minLeadTimeHours = bookingSettings.minLeadTimeHours
    }
    if (typeof bookingSettings?.maxBookingMonths === 'number') {
      maxBookingMonths = bookingSettings.maxBookingMonths
    }
    if (Array.isArray(availability?.blockedRanges)) {
      blockedRanges = availability.blockedRanges
    }
  } catch {
    // Non-fatal: proceed with defaults if globals are unavailable
  }

  // Validate lead time and booking window against admin-driven settings
  if (!isValidSessionDate(date, { minLeadTimeHours, maxBookingMonths })) {
    const leadDays = Math.ceil(minLeadTimeHours / 24)
    return NextResponse.json(
      {
        error: `Please select a date at least ${leadDays} day${leadDays === 1 ? '' : 's'} from today. For sessions more than ${maxBookingMonths} months out, reach out directly at ${CONTACT_EMAIL}.`,
      },
      { status: 400 },
    )
  }

  // Check against blocked/OOO ranges
  if (blockedRanges.length > 0 && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number)
    const submitted = new Date(year, month - 1, day)
    submitted.setHours(0, 0, 0, 0)
    const now = new Date()

    for (const range of blockedRanges) {
      if (!range.startDate || !range.endDate) continue

      const rangeStart = new Date(range.startDate)
      rangeStart.setHours(0, 0, 0, 0)

      const rangeEnd = blockedRangeEnd(
        range.endDate,
        range.applyReturnBuffer ?? true,
        range.returnBufferDays ?? 2,
      )

      // Skip ranges that have fully ended
      if (rangeEnd < now) continue

      if (submitted >= rangeStart && submitted <= rangeEnd) {
        const returnDate = rangeEnd.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
        const message = (range.customerMessage ?? 'That date is not currently available. Please select a different date or reach out directly.')
          .replace('{returnDate}', returnDate)
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }
  }

  const safeName              = escapeHtml(name)
  const safeEmail             = escapeHtml(email)
  const safePhone             = escapeHtml(phone)
  const safeContactPreference = escapeHtml(contactPreference)
  const safeSessionType       = escapeHtml(sessionType)
  const safeDate              = escapeHtml(date)
  const safeLocation          = escapeHtml(location)
  const safeHowHeard          = escapeHtml(howHeard)
  const safeMessage           = escapeHtml(message)

  try {
    await Promise.all([
      resend.emails.send({
        from: EMAIL_FROM,
        to: process.env.CONTACT_TO_EMAIL!,
        replyTo: email,
        subject: `New Inquiry: ${safeSessionType} - ${safeName}`,
        html: inquiryEmailHtml({
          name: safeName,
          email: safeEmail,
          phone: safePhone,
          contactPreference: safeContactPreference,
          sessionType: safeSessionType,
          date: safeDate,
          location: safeLocation,
          howHeard: safeHowHeard,
          message: safeMessage,
        }),
      }),
      resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: `Got your inquiry, ${safeName}!`,
        html: clientAcknowledgmentEmailHtml({
          name: safeName,
          sessionType: safeSessionType,
          date: safeDate,
        }),
      }),
    ])

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
