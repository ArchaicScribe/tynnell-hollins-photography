import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isValidEmail, anyFieldTooLong, CHECKOUT_MAX_LENGTHS, isValidSessionDate, MIN_LEAD_TIME_HOURS, MAX_BOOKING_MONTHS } from '@/app/lib/validation'
import { checkoutRatelimit, getClientIp } from '@/app/lib/ratelimit'
import { isAllowedOrigin } from '@/app/lib/cors'
import { RATE_LIMIT_ERROR, CONTACT_EMAIL } from '@/app/lib/constants'
import { getBlockedDateResult } from '@/app/lib/availability'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const SITE_ORIGIN = 'https://tynnellhollinsphotography.com'

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { success } = await checkoutRatelimit.limit(getClientIp(request))
  if (!success) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 429 })
  }

  const body = await request.json()
  const { packageName, depositAmount, clientName, clientEmail, sessionDate } = body

  if (!packageName || !depositAmount || !clientName || !clientEmail || !sessionDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (
    typeof packageName !== 'string' ||
    typeof clientName !== 'string' ||
    typeof clientEmail !== 'string' ||
    typeof sessionDate !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid field types' }, { status: 400 })
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

  // Fetch booking settings + availability for date validation — fall back to defaults
  let minLeadTimeHours = MIN_LEAD_TIME_HOURS
  let maxBookingMonths = MAX_BOOKING_MONTHS
  let blockedRanges: Array<{
    startDate?: string | null
    endDate?: string | null
    applyReturnBuffer?: boolean | null
    returnBufferDays?: number | null
    customerMessage?: string | null
  }> = []

  const payload = await getPayload({ config })

  try {
    const [bookingSettings, availability] = await Promise.all([
      payload.findGlobal({ slug: 'booking-settings' }),
      payload.findGlobal({ slug: 'availability' }),
    ])

    if (typeof bookingSettings?.minLeadTimeHours === 'number') minLeadTimeHours = bookingSettings.minLeadTimeHours
    if (typeof bookingSettings?.maxBookingMonths === 'number') maxBookingMonths = bookingSettings.maxBookingMonths
    if (Array.isArray(availability?.blockedRanges)) blockedRanges = availability.blockedRanges
  } catch {
    // Non-fatal: proceed with defaults
  }

  if (!isValidSessionDate(sessionDate, { minLeadTimeHours, maxBookingMonths })) {
    const leadDays = Math.ceil(minLeadTimeHours / 24)
    return NextResponse.json(
      { error: `Please select a date at least ${leadDays} day${leadDays === 1 ? '' : 's'} from today and within ${maxBookingMonths} months. For dates further out, reach out directly at ${CONTACT_EMAIL}.` },
      { status: 400 },
    )
  }

  if (blockedRanges.length > 0) {
    const blocked = getBlockedDateResult(sessionDate, blockedRanges)
    if (blocked) {
      return NextResponse.json({ error: blocked.message }, { status: 400 })
    }
  }

  // Validate depositAmount against Payload — Payload is the source of truth for pricing
  const { docs } = await payload.find({
    collection: 'services',
    where: {
      and: [
        { title: { equals: packageName } },
        { depositAmount: { exists: true } },
      ],
    },
    depth: 0,
    limit: 1,
  })
  const payloadPackage = docs[0] ?? null

  if (!payloadPackage) {
    return NextResponse.json({ error: 'Package not found' }, { status: 400 })
  }

  if (payloadPackage.depositAmount !== depositAmount) {
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
            unit_amount: Math.round(depositAmount * 100),
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
        sessionDate,
      },
      success_url: `${SITE_ORIGIN}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_ORIGIN}/book/cancel`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] Stripe session creation failed:', err)
    return NextResponse.json({ error: 'Failed to create checkout session. Please try again.' }, { status: 500 })
  }
}
