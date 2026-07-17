import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireBuilderUser } from '@/app/lib/builderAuth'
import { isValidEmail, anyFieldTooLong, SHARE_MAX_LENGTHS } from '@/app/lib/validation'
import { interpolateHtml, interpolateText } from '@/app/lib/templateInterpolation'
import { templatedCtaEmailHtml } from '@/app/lib/emails'
import { EMAIL_FROM } from '@/app/lib/constants'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = 'https://tynnellhollinsphotography.com'

type Props = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Props) {
  const auth = await requireBuilderUser()
  if (auth instanceof NextResponse) return auth
  const { payload } = auth

  const { id } = await params
  const galleryId = Number(id)
  if (!galleryId || isNaN(galleryId)) {
    return NextResponse.json({ error: 'Invalid gallery id' }, { status: 400 })
  }

  let body: { clientName?: string; clientEmail?: string; expiresAt?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const clientName = (body.clientName ?? '').trim()
  const clientEmail = (body.clientEmail ?? '').trim()
  const expiresAt = body.expiresAt || null

  if (!isValidEmail(clientEmail)) {
    return NextResponse.json({ error: 'A valid client email is required' }, { status: 400 })
  }
  if (anyFieldTooLong({ clientName }, SHARE_MAX_LENGTHS)) {
    return NextResponse.json({ error: 'Client name is too long' }, { status: 400 })
  }
  if (expiresAt) {
    const parsed = new Date(expiresAt)
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Invalid expiration date' }, { status: 400 })
    }
    const endOfExpiryDay = new Date(parsed)
    endOfExpiryDay.setUTCHours(23, 59, 59, 999)
    if (endOfExpiryDay.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Expiration date must be in the future' }, { status: 400 })
    }
  }

  let gallery
  try {
    gallery = await payload.findByID({ collection: 'galleries', id: galleryId, depth: 0 })
  } catch {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
  }
  if (!gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
  }

  let templates
  try {
    templates = await payload.findGlobal({ slug: 'email-templates' })
  } catch (err) {
    console.error('[galleries/share] failed to load email templates:', err)
    return NextResponse.json({ error: 'Failed to load email template' }, { status: 500 })
  }

  const galleryLink = `${SITE_URL}/portfolio/${gallery.slug}`
  const passwordNote = gallery.isPasswordProtected
    ? "This gallery is password protected - I'll share the password with you separately."
    : ''

  const vars: Record<string, string> = {
    clientName: clientName || 'there',
    galleryTitle: gallery.title,
    passwordNote,
  }

  const subject = interpolateText(templates.shareSubject ?? '', vars)
  const headingHtml = interpolateHtml(templates.shareHeading ?? '', vars)
  const bodyHtml = interpolateHtml(templates.shareBody ?? '', vars)

  const html = templatedCtaEmailHtml({
    eyebrowText: 'Your gallery is ready',
    headingHtml,
    bodyHtml,
    ctaHref: galleryLink,
    ctaLabel: templates.shareButtonLabel || 'View Your Gallery',
  })

  // Send first, persist second - the gallery should never claim "shared with
  // X" in the database if no email actually went out.
  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to: clientEmail,
    subject,
    html,
  })

  if (result.error) {
    console.error('[galleries/share] email send failed:', JSON.stringify(result.error))
    return NextResponse.json({ error: 'Failed to send email' }, { status: 502 })
  }

  try {
    await payload.update({
      collection: 'galleries',
      id: galleryId,
      data: {
        clientName: clientName || null,
        clientEmail,
        expiresAt,
        expiryReminderSent: false,
      },
    })
  } catch (err) {
    // The email genuinely sent - log the persistence failure but don't
    // report an error to the caller.
    console.error('[galleries/share] email sent but failed to persist sharing fields:', err)
  }

  return NextResponse.json({ ok: true })
}
