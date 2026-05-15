import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Booking Confirmed | Tynnell Hollins Photography',
}

export default function BookSuccessPage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>You&apos;re on the calendar</p>
        <h1 className={styles.heading}>Deposit Received.</h1>
        <p className={styles.body}>
          Your date is officially held. Check your inbox for a confirmation email —
          I&apos;ll be in touch shortly to finalize the details and start planning your session.
        </p>
        <p className={styles.body}>
          Can&apos;t wait to work with you.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.homeBtn}>Back to Home</Link>
          <Link href="/contact" className={styles.contactLink}>Send a message</Link>
        </div>
      </div>
    </main>
  )
}
