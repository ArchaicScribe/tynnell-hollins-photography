import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import Stripe from 'stripe'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ orders: [] }, { status: 401 })

  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('placeholder')) return NextResponse.json({ orders: [] })

  const stripe = new Stripe(key)
  let sessions
  try {
    sessions = await stripe.checkout.sessions.list({ limit: 20 })
  } catch (err) {
    console.error('[admin/recent-orders] Stripe session list failed:', err)
    return NextResponse.json({ orders: [] })
  }

  const orders = sessions.data
    .filter(s => s.payment_status === 'paid')
    .slice(0, 5)
    .map(s => ({
      id: s.id,
      orderNum: s.id.slice(-8).toUpperCase(),
      status: 'Complete',
      customer: s.customer_details?.name ?? s.customer_details?.email ?? 'Unknown',
      date: new Date(s.created * 1000).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
      amount: s.amount_total != null ? `$${(s.amount_total / 100).toFixed(2)}` : null,
    }))

  return NextResponse.json({ orders })
}
