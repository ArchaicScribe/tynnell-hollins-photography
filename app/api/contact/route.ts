import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isValidEmail, isValidPhone, isValidSessionDate, escapeHtml, anyFieldTooLong, CONTACT_MAX_LENGTHS, MIN_LEAD_TIME_HOURS, MAX_BOOKING_MONTHS } from '@/app/lib/validation'
import { contactRatelimit, getClientIp, safeLimit } from '@/app/lib/ratelimit'
import { isAllowedOrigin } from '@/app/lib/cors'
import { inquiryEmailHtml, clientAcknowledgmentEmailHtml } from '@/app/lib/emails'
import { CONTACT_EMAIL, EMAIL_FROM, RATE_LIMIT_ERROR } from '@/app/lib/constants'
import { getActiveOoo, getBlockedDateResult } from '@/app/lib/availability'
import { verifyTurnstile } from '@/app/lib/turnstile'
import { parseInquiryKind, validateKindFields } from '@/app/lib/inquiry'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)


export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { name, email, phone, contactPreference, partnerName, date, location, message, howHeard, website, turnstileToken } = body
  let { sessionType } = body

  // Honeypot (TYN-357): a real visitor never sees or fills in `website` (see
  // ContactForm.tsx). A bot that fills every field blindly trips this. Return
  // a fake success rather than a 400/403 - telling the bot it was caught
  // just teaches it to route around this specific check next time. Checked
  // before rate limiting/validation so obvious bot traffic costs nothing.
  if (typeof website === 'string' && website.trim().length > 0) {
    console.log('[contact] honeypot triggered, silently dropping submission')
    return NextResponse.json({ success: true })
  }

  const { success } = await safeLimit(contactRatelimit, getClientIp(request))
  if (!success) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 429 })
  }

  // A wedding or portrait inquiry (the shorter Rising Roots forms) sends a
  // `kind`; no kind is the original general form, validated exactly as before.
  const kind = parseInquiryKind(body.kind)
  if (kind === 'invalid') {
    return NextResponse.json({ error: 'Invalid inquiry type' }, { status: 400 })
  }
  if (kind) {
    const problem = validateKindFields(kind, body)
    if (problem) return NextResponse.json({ error: problem }, { status: 400 })
    if (kind === 'wedding') sessionType = 'Wedding'
  } else if (!name || !email || !phone || !contactPreference || !sessionType || !date || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (anyFieldTooLong({ name, phone, contactPreference, sessionType, partnerName, date, location, message, howHeard }, CONTACT_MAX_LENGTHS)) {
    return NextResponse.json({ error: 'One or more fields exceeds the maximum allowed length' }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  if (!kind && !isValidPhone(phone)) {
    return NextResponse.json({ error: 'Please enter a valid phone number (at least 7 digits).' }, { status: 400 })
  }

  // Cloudflare Turnstile (TYN-357), shared with the email signup form. Lets
  // everything through until a widget's keys are set; see app/lib/turnstile.ts.
  if (!(await verifyTurnstile(turnstileToken, getClientIp(request)))) {
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 400 })
  }

  // Fetch booking settings and availability from the admin - fall back to
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
    const [bookingSettings, availability] = await Promise.all([
      payload.findGlobal({ slug: 'booking-settings' }),
      payload.findGlobal({ slug: 'availability' }),
    ])

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
  // The kind forms treat the date as optional: only check one that was sent.
  const hasDate = !kind || (typeof date === 'string' && date.trim() !== '')
  if (hasDate && !isValidSessionDate(date, { minLeadTimeHours, maxBookingMonths })) {
    const leadDays = Math.ceil(minLeadTimeHours / 24)
    return NextResponse.json(
      {
        error: `Please select a date at least ${leadDays} day${leadDays === 1 ? '' : 's'} from today. For sessions more than ${maxBookingMonths} months out, reach out directly at ${CONTACT_EMAIL}.`,
      },
      { status: 400 },
    )
  }

  // Check if the requested session date falls within a blocked range
  if (hasDate && blockedRanges.length > 0 && typeof date === 'string') {
    const blocked = getBlockedDateResult(date, blockedRanges)
    if (blocked) {
      return NextResponse.json({ error: blocked.message }, { status: 400 })
    }
  }

  // Check if today is within an OOO period - used to set acknowledgment expectations
  const activeOoo = blockedRanges.length > 0 ? getActiveOoo(blockedRanges) : null

  const safeName              = escapeHtml(name)
  const safeEmail             = escapeHtml(email)
  const safePhone             = phone ? escapeHtml(phone) : undefined
  const safeContactPreference = contactPreference ? escapeHtml(contactPreference) : undefined
  const safeSessionType       = escapeHtml(sessionType)
  const safePartnerName       = partnerName ? escapeHtml(partnerName) : undefined
  const safeDate              = hasDate && date ? escapeHtml(date) : undefined
  const safeLocation          = escapeHtml(location)
  const safeHowHeard          = escapeHtml(howHeard)
  const safeMessage           = escapeHtml(message)

  // Resend SDK returns { data, error } and does NOT throw on API failures.
  // We must check the error property explicitly - a try/catch alone is not sufficient.
  try {
    const contactTo = process.env.CONTACT_TO_EMAIL
    if (!contactTo) {
      console.error('[contact] CONTACT_TO_EMAIL env var is not set')
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
    }

    const [inquiryResult, ackResult] = await Promise.all([
      resend.emails.send({
        from: EMAIL_FROM,
        to: contactTo,
        replyTo: email,
        subject: kind ? `New ${kind === 'wedding' ? 'Wedding' : 'Portrait'} Inquiry - ${safeName}` : `New Inquiry: ${safeSessionType} - ${safeName}`,
        html: inquiryEmailHtml({
          name: safeName,
          email: safeEmail,
          phone: safePhone,
          contactPreference: safeContactPreference,
          sessionType: safeSessionType,
          partnerName: safePartnerName,
          date: safeDate,
          location: safeLocation,
          howHeard: safeHowHeard,
          message: safeMessage,
        }),
      }),
      resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        replyTo: contactTo,
        subject: `Got your inquiry, ${safeName}!`,
        html: clientAcknowledgmentEmailHtml({
          name: safeName,
          sessionType: safeSessionType,
          date: safeDate,
          oooMessage: activeOoo?.message,
        }),
      }),
    ])

    if (inquiryResult.error) {
      console.error('[contact] inquiry email failed:', JSON.stringify(inquiryResult.error))
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
    }

    if (ackResult.error) {
      // Non-fatal: inquiry already delivered; log but still return success
      console.error('[contact] acknowledgment email failed (non-fatal):', JSON.stringify(ackResult.error))
    }

    console.log('[contact] inquiry sent. ID:', inquiryResult.data?.id, '| ack sent:', !ackResult.error)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[contact] unexpected error:', e)
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
