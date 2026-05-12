import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { groq } from 'next-sanity'
import { client } from '@/sanity/lib/client'
import { isValidEmail, anyFieldTooLong, CHECKOUT_MAX_LENGTHS } from '@/app/lib/validation'
import { checkoutRatelimit, getClientIp } from '@/app/lib/ratelimit'
import { isAllowedOrigin } from '@/app/lib/cors'

export const dynamic = 'force-dynamic'

const SITE_ORIGIN = 'https://tynnellhollinsphotography.com'

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { success } = await checkoutRatelimit.limit(getClientIp(request))
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const body = await request.json()
  const { packageName, depositAmount, clientName, clientEmail } = body

  if (!packageName || !depositAmount || !clientName || !clientEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (anyFieldTooLong({ packageName, clientName }, CHECKOUT_MAX_LENGTHS)) {
    return NextResponse.json({ error: 'One or more fields exceeds the maximum allowed length' }, { status: 400 })
  }

  if (typeof depositAmount !== 'number' || depositAmount <= 0) {
    return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 })
  }

  if (!isValidEmail(clientEmail)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Validate depositAmount against Sanity - Sanity is the source of truth for pricing
  const sanityPackage = await client.fetch<{ depositAmount: number } | null>(
    groq`*[_type == "service" && title == $packageName && defined(depositAmount)][0] {
      depositAmount
    }`,
    { packageName }
  )

  if (!sanityPackage) {
    return NextResponse.json({ error: 'Package not found' }, { status: 400 })
  }

  if (sanityPackage.depositAmount !== depositAmount) {
    return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 })
  }

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
      success_url: `${SITE_ORIGIN}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_ORIGIN}/book/cancel`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
