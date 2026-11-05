import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isValidEmail, escapeHtml } from '@/app/lib/validation'
import { subscribeRatelimit, getClientIp, safeLimit } from '@/app/lib/ratelimit'
import { isAllowedOrigin } from '@/app/lib/cors'
import { verifyTurnstile } from '@/app/lib/turnstile'
import { isSafeLink } from '@/app/lib/menuCards'
import { freebieEmailHtml } from '@/app/lib/emails'
import { EMAIL_FROM, CONTACT_EMAIL, RATE_LIMIT_ERROR, SITE_URL } from '@/app/lib/constants'

// Email signup (Rising Roots gap 5): the Email Signup builder block posts
// here. Subscribers go into Resend contacts (optionally a segment, via
// RESEND_SEGMENT_ID). A "freebie" signup is also emailed the freebie link set
// in Site Settings.
//
// The freebie link is read from the SiteConfig global only. Taking it from
// the request would let anyone make this site email any link to any address.
export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

const FIRST_NAME_MAX = 100
const FAILED = 'Something went wrong. Please try again.'

// Resend has no dedicated "already exists" code; it answers 409, or a
// validation error saying so.
function isAlreadySubscribed(error: { statusCode?: number | null; message?: string }): boolean {
  return error.statusCode === 409 || /already exist/i.test(error.message ?? '')
}

async function sendFreebie(to: string, firstName: string): Promise<boolean> {
  let title = ''
  let link = ''
  try {
    const payload = await getPayload({ config })
    const site = await payload.findGlobal({ slug: 'site-config' })
    title = (site.freebieTitle ?? '').trim()
    link = (site.freebieUrl ?? '').trim()
  } catch (e) {
    console.error('[subscribe] could not read the freebie settings:', e)
    return false
  }
  if (!link || !isSafeLink(link)) return false

  const url = link.startsWith('/') ? `${SITE_URL}${link}` : link
  const subject = title ? `Your free guide: ${title}` : 'Your free guide'
  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    replyTo: CONTACT_EMAIL,
    subject,
    html: freebieEmailHtml({
      firstName: escapeHtml(firstName),
      title: escapeHtml(title || 'Your free guide'),
      url: escapeHtml(url),
    }),
  })
  if (result.error) {
    console.error('[subscribe] freebie email failed:', JSON.stringify(result.error))
    return false
  }
  return true
}

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
  const { email, firstName, kind, website, turnstileToken } = body

  // Honeypot, same as the contact form: a fake success teaches a bot nothing.
  if (typeof website === 'string' && website.trim()) {
    return NextResponse.json({ success: true, freebieSent: false })
  }

  const { success } = await safeLimit(subscribeRatelimit, getClientIp(request))
  if (!success) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 429 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  const name = typeof firstName === 'string' ? firstName.trim() : ''
  if (name.length > FIRST_NAME_MAX) {
    return NextResponse.json({ error: 'That name is too long.' }, { status: 400 })
  }

  if (!(await verifyTurnstile(turnstileToken, getClientIp(request)))) {
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 400 })
  }

  try {
    const segment = process.env.RESEND_SEGMENT_ID
    const { error } = await resend.contacts.create({
      email,
      ...(name ? { firstName: name } : {}),
      unsubscribed: false,
      ...(segment ? { segments: [{ id: segment }] } : {}),
    })
    if (error && !isAlreadySubscribed(error)) {
      console.error('[subscribe] adding contact failed:', JSON.stringify(error))
      return NextResponse.json({ error: FAILED }, { status: 500 })
    }

    const freebieSent = kind === 'freebie' ? await sendFreebie(email, name) : false
    return NextResponse.json({ success: true, freebieSent })
  } catch (e) {
    console.error('[subscribe] unexpected error:', e)
    return NextResponse.json({ error: FAILED }, { status: 500 })
  }
}
