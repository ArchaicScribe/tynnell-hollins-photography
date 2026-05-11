import Stripe from 'stripe'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { escapeHtml } from '@/app/lib/validation'

export const dynamic = 'force-dynamic'

// Stripe requires the raw request body for signature verification —
// disable Next.js body parsing by reading text directly.
export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const resend = new Resend(process.env.RESEND_API_KEY)

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
    console.error('Stripe webhook error:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const clientName  = escapeHtml(session.metadata?.clientName ?? 'Client')
    const clientEmail = escapeHtml(session.metadata?.clientEmail ?? session.customer_email ?? '')
    const packageName = escapeHtml(session.metadata?.packageName ?? 'Session')
    const amountPaid  = session.amount_total ? `$${(session.amount_total / 100).toFixed(0)}` : ''

    // Email to Tynnell
    await resend.emails.send({
      from: 'Tynnell Hollins Photography <hello@tynnellhollinsphotography.com>',
      to: process.env.CONTACT_TO_EMAIL!,
      subject: `New Booking Deposit: ${packageName} - ${clientName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="border-bottom: 1px solid #eee; padding-bottom: 1rem;">New Booking Deposit Received</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 160px;">Client</td>
              <td style="padding: 8px 0;">${clientName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email</td>
              <td style="padding: 8px 0;"><a href="mailto:${clientEmail}">${clientEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Package</td>
              <td style="padding: 8px 0;">${packageName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Deposit Paid</td>
              <td style="padding: 8px 0;">${amountPaid}</td>
            </tr>
          </table>
          <p style="margin-top: 1.5rem; color: #555;">Reach out to ${clientName} to confirm the date and next steps.</p>
        </div>
      `,
    })

    // Confirmation email to client - use raw (unescaped) email as the To address
    const rawClientEmail = session.metadata?.clientEmail ?? session.customer_email ?? ''
    if (rawClientEmail) {
      await resend.emails.send({
        from: 'Tynnell Hollins Photography <hello@tynnellhollinsphotography.com>',
        to: rawClientEmail,
        replyTo: process.env.CONTACT_TO_EMAIL,
        subject: `Your deposit is confirmed - ${packageName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="border-bottom: 1px solid #eee; padding-bottom: 1rem;">You're officially on the calendar.</h2>
            <p>Hi ${clientName},</p>
            <p>Your ${amountPaid} deposit for a <strong>${packageName}</strong> session has been received. Your date is now held.</p>
            <p>I'll be reaching out shortly to confirm all the details and start planning your session.</p>
            <p style="margin-top: 2rem;">Talk soon,<br/><strong>Tynnell Hollins</strong><br/>Tynnell Hollins Photography</p>
            <hr style="margin: 2rem 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #999; font-size: 0.8rem;">Questions? Reply to this email or reach out at <a href="mailto:hello@tynnellhollinsphotography.com">hello@tynnellhollinsphotography.com</a></p>
          </div>
        `,
      })
    }
  }

  return NextResponse.json({ received: true })
}
