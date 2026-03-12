import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const body = await request.json()
  const { name, email, phone, sessionType, date, location, message, howHeard } = body

  if (!name || !email || !sessionType || !date || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  try {
    await resend.emails.send({
      from: 'Tynnell Hollins Photography <hello@tynnellhollinsphotography.com>',
      to: process.env.CONTACT_TO_EMAIL!,
      replyTo: email,
      subject: `New Inquiry: ${sessionType} — ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="border-bottom: 1px solid #eee; padding-bottom: 1rem;">New Session Inquiry</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 160px;">Name</td>
              <td style="padding: 8px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email</td>
              <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Phone</td>
              <td style="padding: 8px 0;">${phone}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Session Type</td>
              <td style="padding: 8px 0;">${sessionType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Desired Date</td>
              <td style="padding: 8px 0;">${date}</td>
            </tr>
            ${location ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Location / Venue</td>
              <td style="padding: 8px 0;">${location}</td>
            </tr>` : ''}
            ${howHeard ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">How They Found You</td>
              <td style="padding: 8px 0;">${howHeard}</td>
            </tr>` : ''}
          </table>
          <h3 style="margin-top: 1.5rem;">Message</h3>
          <p style="white-space: pre-wrap; background: #f9f9f9; padding: 1rem; border-radius: 4px;">${message}</p>
          <p style="margin-top: 2rem; color: #999; font-size: 0.875rem;">
            Reply directly to this email to respond to ${name}.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
