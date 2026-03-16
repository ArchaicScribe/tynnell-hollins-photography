import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Booking Cancelled | Tynnell Hollins Photography',
}

export default function BookCancelPage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>No worries</p>
        <h1 className={styles.heading}>Payment Cancelled.</h1>
        <p className={styles.body}>
          Your booking wasn&apos;t completed — nothing was charged. Your date hasn&apos;t been held yet.
        </p>
        <p className={styles.body}>
          Ready to try again, or have questions first?
        </p>
        <div className={styles.actions}>
          <Link href="/book" className={styles.tryAgainBtn}>Back to Booking</Link>
          <Link href="/contact" className={styles.contactLink}>Send a message</Link>
        </div>
      </div>
    </main>
  )
}
