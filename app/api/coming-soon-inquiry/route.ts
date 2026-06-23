import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { isValidEmail, isValidPhone, escapeHtml } from '@/app/lib/validation'
import { comingSoonRatelimit, getClientIp } from '@/app/lib/ratelimit'
import { isAllowedOrigin } from '@/app/lib/cors'
import { comingSoonInquiryEmailHtml } from '@/app/lib/emails'
import { CONTACT_EMAIL, EMAIL_FROM, RATE_LIMIT_ERROR } from '@/app/lib/constants'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { success } = await comingSoonRatelimit.limit(getClientIp(request))
  if (!success) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 429 })
  }

  const body = await request.json()
  const { name, email, phone, eventDate, message } = body

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 })
  }

  if (name.length > 100) {
    return NextResponse.json({ error: 'Name is too long.' }, { status: 400 })
  }
  if (message.length > 1000) {
    return NextResponse.json({ error: 'Message is too long (max 1000 characters).' }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  if (phone && !isValidPhone(phone)) {
    return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 })
  }

  const safeName      = escapeHtml(name)
  const safeEmail     = escapeHtml(email)
  const safePhone     = phone ? escapeHtml(phone) : undefined
  const safeEventDate = eventDate ? escapeHtml(eventDate) : undefined
  const safeMessage   = escapeHtml(message)

  try {
    const contactTo = process.env.CONTACT_TO_EMAIL
    if (!contactTo) {
      console.error('[coming-soon-inquiry] CONTACT_TO_EMAIL env var is not set')
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
    }

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: contactTo,
      replyTo: email,
      subject: `Pre-Launch Inquiry from ${safeName}`,
      html: comingSoonInquiryEmailHtml({ name: safeName, email: safeEmail, phone: safePhone, eventDate: safeEventDate, message: safeMessage }),
    })

    if (error) {
      console.error('[coming-soon-inquiry] email failed:', JSON.stringify(error))
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
    }

    console.log('[coming-soon-inquiry] inquiry sent from:', safeEmail)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[coming-soon-inquiry] unexpected error:', e)
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
