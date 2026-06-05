import Stripe from 'stripe'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { escapeHtml } from '@/app/lib/validation'
import { bookingConfirmEmailHtml, clientReceiptEmailHtml } from '@/app/lib/emails'
import { EMAIL_FROM } from '@/app/lib/constants'
import { getActiveOoo } from '@/app/lib/availability'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)

// Stripe requires the raw request body for signature verification —
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
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const clientName  = escapeHtml(session.metadata?.clientName ?? 'Client')
    const clientEmail = escapeHtml(session.metadata?.clientEmail ?? session.customer_email ?? '')
    const packageName = escapeHtml(session.metadata?.packageName ?? 'Session')
    const amountPaid  = session.amount_total ? `$${(session.amount_total / 100).toFixed(0)}` : ''

    // Check OOO status — non-fatal if unavailable
    let oooMessage: string | undefined
    try {
      const payload = await getPayload({ config })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const availability = await payload.findGlobal({ slug: 'availability' as any }) as any
      if (Array.isArray(availability?.blockedRanges)) {
        const ooo = getActiveOoo(availability.blockedRanges)
        oooMessage = ooo?.message
      }
    } catch {
      // Non-fatal: send standard receipt if globals are unavailable
    }

    // Email to Tynnell
    await resend.emails.send({
      from: EMAIL_FROM,
      to: process.env.CONTACT_TO_EMAIL!,
      subject: `New Booking Deposit: ${packageName} - ${clientName}`,
      html: bookingConfirmEmailHtml({ clientName, clientEmail, packageName, amountPaid }),
    })

    // Confirmation email to client
    const rawClientEmail = session.metadata?.clientEmail ?? session.customer_email ?? ''
    if (rawClientEmail) {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: rawClientEmail,
        replyTo: process.env.CONTACT_TO_EMAIL,
        subject: `Your deposit is confirmed - ${packageName}`,
        html: clientReceiptEmailHtml({ clientName, packageName, amountPaid, oooMessage }),
      })
    }
  }

  return NextResponse.json({ received: true })
}
