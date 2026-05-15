import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import BookClient, { type BookingPackage } from './BookClient'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Book a Session | Tynnell Hollins Photography',
  description: 'Reserve your date with a deposit. Choose from weddings, portraits, families, engagements, maternity, and brand sessions.',
}

export default async function BookPage() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'services',
    where: { depositAmount: { exists: true } },
    sort: 'displayOrder',
    depth: 0,
  })

  const packages: BookingPackage[] = docs.map(s => ({
    id: String(s.id),
    eyebrow: s.eyebrow ?? undefined,
    title: s.title,
    description: s.description ?? undefined,
    depositAmount: s.depositAmount ?? 0,
  }))

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Reserve Your Date</p>
        <h1 className={styles.heading}>Book a Session</h1>
        <p className={styles.subheading}>
          A deposit secures your date. The remaining balance is due before your session.
          Have questions first?{' '}
          <a href="/contact" className={styles.subheadingLink}>Send an inquiry.</a>
        </p>
      </div>

      <BookClient packages={packages} />
    </main>
  )
}
