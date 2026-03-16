import Stripe from 'stripe'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const body = await request.json()
  const { packageName, depositAmount, clientName, clientEmail } = body

  if (!packageName || !depositAmount || !clientName || !clientEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (typeof depositAmount !== 'number' || depositAmount <= 0) {
    return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 })
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tynnellhollinsphotography.com'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: clientEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(depositAmount * 100), // convert dollars → cents
            product_data: {
              name: `${packageName} — Booking Deposit`,
              description: `Secures your date with Tynnell Hollins Photography. The remaining balance is due before your session.`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        clientName,
        clientEmail,
        packageName,
      },
      success_url: `${origin}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book/cancel`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
