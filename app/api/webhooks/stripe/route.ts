import Stripe from 'stripe'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { escapeHtml } from '@/app/lib/validation'
import { bookingConfirmEmailHtml, clientReceiptEmailHtml } from '@/app/lib/emails'
import { EMAIL_FROM } from '@/app/lib/constants'
import { getActiveOoo } from '@/app/lib/availability'
import { requireEnv } from '@/app/lib/env'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'))
const resend = new Resend(process.env.RESEND_API_KEY)

// Stripe requires the raw request body for signature verification -
// disable Next.js body parsing by reading text directly.
export async function POST(request: Request) {

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
      requireEnv('STRIPE_WEBHOOK_SECRET')
    )
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const clientName  = escapeHtml(session.metadata?.clientName ?? 'Client')
    const clientEmail = escapeHtml(session.metadata?.clientEmail ?? session.customer_email ?? '')
    const packageName = escapeHtml(session.metadata?.packageName ?? 'Session')
    const amountPaid  = session.amount_total ? `$${(session.amount_total / 100).toFixed(0)}` : ''

    // Check OOO status - non-fatal if unavailable
    let oooMessage: string | undefined
    try {
      const payload = await getPayload({ config })
      const availability = await payload.findGlobal({ slug: 'availability' })
      if (Array.isArray(availability?.blockedRanges)) {
        const ooo = getActiveOoo(availability.blockedRanges)
        oooMessage = ooo?.message
      }
    } catch {
      // Non-fatal: send standard receipt if globals are unavailable
    }

    // Email to Tynnell.
    // The Resend SDK returns { data, error } and does NOT throw on API failures,
    // so we must inspect .error explicitly or a failed send is silently lost.
    const notifyResult = await resend.emails.send({
      from: EMAIL_FROM,
      to: process.env.CONTACT_TO_EMAIL!,
      subject: `New Booking Deposit: ${packageName} - ${clientName}`,
      html: bookingConfirmEmailHtml({ clientName, clientEmail, packageName, amountPaid }),
    })
    if (notifyResult.error) {
      console.error('[stripe-webhook] booking notification email failed:', JSON.stringify(notifyResult.error))
    }

    // Confirmation email to client
    const rawClientEmail = session.metadata?.clientEmail ?? session.customer_email ?? ''
    if (rawClientEmail) {
      const receiptResult = await resend.emails.send({
        from: EMAIL_FROM,
        to: rawClientEmail,
        replyTo: process.env.CONTACT_TO_EMAIL,
        subject: `Your deposit is confirmed - ${packageName}`,
        html: clientReceiptEmailHtml({ clientName, packageName, amountPaid, oooMessage }),
      })
      if (receiptResult.error) {
        console.error('[stripe-webhook] client receipt email failed:', JSON.stringify(receiptResult.error))
      }
    }
  }

  // Always return 200 so Stripe does not retry the whole event over an email
  // hiccup -- the payment itself already succeeded. Email failures are logged above.
  return NextResponse.json({ received: true })
}
