import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import BookClient, { type BookingPackage } from './BookClient'
import styles from './page.module.css'
import { getActiveOoo } from '@/app/lib/availability'
import { MIN_LEAD_TIME_HOURS, MAX_BOOKING_MONTHS } from '@/app/lib/validation'

// OOO banner is time-sensitive - shorter revalidate so it appears within 1 minute of being set
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Book a Session',
  description: 'Reserve your date with a deposit. Choose from weddings, portraits, families, engagements, maternity, and brand sessions.',
}

export default async function BookPage() {
  const payload = await getPayload({ config })

  const [{ docs }, availability, bookingSettings] = await Promise.all([
    payload.find({
      collection: 'services',
      where: { depositAmount: { exists: true } },
      sort: 'displayOrder',
      depth: 0,
      limit: 50,
    }),
    payload.findGlobal({ slug: 'availability' }).catch(() => null),
    payload.findGlobal({ slug: 'booking-settings' }).catch(() => null),
  ])

  const packages: BookingPackage[] = docs.map(s => ({
    id: String(s.id),
    eyebrow: s.eyebrow ?? undefined,
    title: s.title,
    description: s.description ?? undefined,
    depositAmount: s.depositAmount ?? 0,
  }))

  const ooo = Array.isArray(availability?.blockedRanges)
    ? getActiveOoo(availability.blockedRanges)
    : null

  const minLeadHours = typeof bookingSettings?.minLeadTimeHours === 'number'
    ? bookingSettings.minLeadTimeHours
    : MIN_LEAD_TIME_HOURS
  const maxMonths = typeof bookingSettings?.maxBookingMonths === 'number'
    ? bookingSettings.maxBookingMonths
    : MAX_BOOKING_MONTHS

  const minDate = (() => {
    const d = new Date()
    d.setTime(d.getTime() + minLeadHours * 60 * 60 * 1000)
    return d.toISOString().split('T')[0]
  })()
  const maxDate = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() + maxMonths)
    return d.toISOString().split('T')[0]
  })()

  return (
    <main className={styles.page}>
      {ooo && (
        <div className={styles.oooBanner} role="note" aria-label="Availability notice">
          <p className={styles.oooMessage}>{ooo.message}</p>
        </div>
      )}
      <div className={styles.header}>
        <p className={styles.eyebrow}>Reserve Your Date</p>
        <h1 className={styles.heading}>Book a Session</h1>
        <p className={styles.subheading}>
          A deposit secures your date. The remaining balance is due before your session.
          Have questions first?{' '}
          <Link href="/contact" className={styles.subheadingLink}>Send an inquiry.</Link>
        </p>
      </div>

      <Suspense fallback={null}>
        <BookClient packages={packages} minDate={minDate} maxDate={maxDate} />
      </Suspense>
    </main>
  )
}
