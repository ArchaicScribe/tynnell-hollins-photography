import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPayload } from 'payload'
import config from '@payload-config'
import { EMAIL_FROM } from '@/app/lib/constants'
import { templatedCtaEmailHtml } from '@/app/lib/emails'
import { interpolateHtml, interpolateText } from '@/app/lib/templateInterpolation'
import { daysUntilExpiry } from '@/app/lib/galleryExpiry'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = 'https://tynnellhollinsphotography.com'

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron/gallery-expiry-notify] CRON_SECRET is not set; refusing request')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const templates = await payload.findGlobal({ slug: 'email-templates' })
    const reminderDaysBefore = templates.reminderDaysBefore ?? 3

    const { docs: galleries } = await payload.find({
      collection: 'galleries',
      where: {
        and: [
          { expiresAt: { exists: true } },
          { clientEmail: { exists: true } },
          { expiryReminderSent: { not_equals: true } },
          { status: { not_equals: 'draft' } },
        ],
      },
      depth: 0,
      limit: 500,
    })

    let sent = 0

    for (const gallery of galleries) {
      if (!gallery.expiresAt || !gallery.clientEmail) continue

      const remaining = daysUntilExpiry(gallery.expiresAt)
      if (remaining === null || remaining < 0 || remaining > reminderDaysBefore) continue

      const expiresAtStr = new Date(gallery.expiresAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })

      const vars: Record<string, string> = {
        clientName: gallery.clientName || 'there',
        galleryTitle: gallery.title,
        expiresAt: expiresAtStr,
      }

      const subject = interpolateText(templates.reminderSubject ?? '', vars)
      const headingHtml = interpolateHtml(templates.reminderHeading ?? '', vars)
      const bodyHtml = interpolateHtml(templates.reminderBody ?? '', vars)

      const html = templatedCtaEmailHtml({
        eyebrowText: 'Expiring soon',
        headingHtml,
        bodyHtml,
        ctaHref: `${SITE_URL}/portfolio/${gallery.slug}`,
        ctaLabel: templates.reminderButtonLabel || 'View Your Gallery',
      })

      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: gallery.clientEmail,
        subject,
        html,
      })

      if (result.error) {
        console.error(`[cron/gallery-expiry-notify] email send failed for gallery ${gallery.id}:`, JSON.stringify(result.error))
        continue
      }

      await payload.update({
        collection: 'galleries',
        id: gallery.id,
        data: { expiryReminderSent: true },
      })
      sent++
    }

    return NextResponse.json({ sent })
  } catch (err) {
    console.error('[cron/gallery-expiry-notify] unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
