import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Booking Cancelled',
  robots: { index: false },
}

export default function BookCancelPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-label="Payment cancelled">
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>No worries</p>
          <h1 className={styles.heroHeading}>Payment Cancelled.</h1>
        </div>
      </section>
      <div className={styles.content}>
        <p className={styles.body}>
          Your booking wasn&apos;t completed. Nothing was charged. Your date hasn&apos;t been held yet.
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
