import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { escapeHtml } from '@/app/lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const body = await request.json()
  const { name, email, phone, contactPreference, sessionType, date, location, message, howHeard } = body

  if (!name || !email || !phone || !contactPreference || !sessionType || !date || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
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
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="border-bottom: 1px solid #eee; padding-bottom: 1rem;">New Session Inquiry</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 160px;">Name</td>
              <td style="padding: 8px 0;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email</td>
              <td style="padding: 8px 0;"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Phone</td>
              <td style="padding: 8px 0;">${safePhone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Preferred Contact</td>
              <td style="padding: 8px 0;">${safeContactPreference}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Session Type</td>
              <td style="padding: 8px 0;">${safeSessionType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Desired Date</td>
              <td style="padding: 8px 0;">${safeDate}</td>
            </tr>
            ${safeLocation ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Location / Venue</td>
              <td style="padding: 8px 0;">${safeLocation}</td>
            </tr>` : ''}
            ${safeHowHeard ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">How They Found You</td>
              <td style="padding: 8px 0;">${safeHowHeard}</td>
            </tr>` : ''}
          </table>
          <h3 style="margin-top: 1.5rem;">Message</h3>
          <p style="white-space: pre-wrap; background: #f9f9f9; padding: 1rem; border-radius: 4px;">${safeMessage}</p>
          <p style="margin-top: 2rem; color: #999; font-size: 0.875rem;">
            Reply directly to this email to respond to ${safeName}.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
