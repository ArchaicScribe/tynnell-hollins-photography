import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { isValidEmail, isValidSessionDate, escapeHtml, anyFieldTooLong, CONTACT_MAX_LENGTHS } from '@/app/lib/validation'
import { contactRatelimit, getClientIp } from '@/app/lib/ratelimit'
import { isAllowedOrigin } from '@/app/lib/cors'
import { inquiryEmailHtml } from '@/app/lib/emails'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json()
  const { name, email, phone, contactPreference, sessionType, date, location, message, howHeard } = body

  const { success } = await contactRatelimit.limit(getClientIp(request))
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
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

  if (!isValidSessionDate(date)) {
    return NextResponse.json(
      { error: `Please select a date at least 2 days from today. For sessions more than 2 years out, reach out directly at hello@tynnellhollinsphotography.com.` },
      { status: 400 },
    )
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
    await resend.emails.send({
      from: 'Tynnell Hollins Photography <hello@tynnellhollinsphotography.com>',
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
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
