import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import payloadConfig from '@payload-config'
import Stripe from 'stripe'
import { StudioManagerClient } from './StudioManagerClient'

export const dynamic = 'force-dynamic'

export type MonthRevenue = { label: string; amount: number }

function greeting(name: string) {
  const h = new Date().getHours()
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  return `Good ${time}, ${name}`
}

export default async function StudioManagerPage() {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const firstName = (user.email ?? '').split('@')[0].split('.')[0]
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  const now = Date.now()
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000

  const monthlyRevenue: MonthRevenue[] = []
  let totalRevenue = 0

  // Pre-fill 12 months of zeroes so the chart always has a baseline
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    monthlyRevenue.push({ label, amount: 0 })
  }

  try {
    const key = process.env.STRIPE_SECRET_KEY
    if (key) {
      const stripe = new Stripe(key)
      let hasMore = true
      let startingAfter: string | undefined

      while (hasMore) {
        const res = await stripe.paymentIntents.list({
          limit: 100,
          created: { gte: Math.floor(oneYearAgo / 1000) },
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        })

        for (const intent of res.data) {
          if (intent.status === 'succeeded') {
            const d = new Date(intent.created * 1000)
            const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            const entry = monthlyRevenue.find(m => m.label === label)
            if (entry) entry.amount += intent.amount_received / 100
          }
        }

        hasMore = res.has_more
        if (hasMore && res.data.length > 0) startingAfter = res.data[res.data.length - 1].id
        else hasMore = false
      }

      totalRevenue = monthlyRevenue.reduce((s, m) => s + m.amount, 0)
    }
  } catch {
    // Stripe unavailable - chart stays at zero
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <StudioManagerClient
      greeting={greeting(displayName)}
      today={today}
      monthlyRevenue={monthlyRevenue}
      totalRevenue={totalRevenue}
      userName={user.email ?? ''}
    />
  )
}
