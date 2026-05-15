import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { bookingPackagesQuery } from '@/sanity/queries'
import BookClient, { type BookingPackage } from './BookClient'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Book a Session | Tynnell Hollins Photography',
  description: 'Reserve your date with a deposit. Choose from weddings, portraits, families, engagements, maternity, and brand sessions.',
}

export default async function BookPage() {
  const { data: packages } = await sanityFetch({ query: bookingPackagesQuery })

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

      <BookClient packages={(packages ?? []) as BookingPackage[]} />
    </main>
  )
}
