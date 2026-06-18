import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import BookClient, { type BookingPackage } from './BookClient'
import styles from './page.module.css'
import { getActiveOoo } from '@/app/lib/availability'

// OOO banner is time-sensitive - shorter revalidate so it appears within 1 minute of being set
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Book a Session',
  description: 'Reserve your date with a deposit. Choose from weddings, portraits, families, engagements, maternity, and brand sessions.',
}

export default async function BookPage() {
  const payload = await getPayload({ config })

  const [{ docs }, availability] = await Promise.all([
    payload.find({
      collection: 'services',
      where: { depositAmount: { exists: true } },
      sort: 'displayOrder',
      depth: 0,
    }),
    payload.findGlobal({ slug: 'availability' }).catch(() => null),
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
        <BookClient packages={packages} />
      </Suspense>
    </main>
  )
}
