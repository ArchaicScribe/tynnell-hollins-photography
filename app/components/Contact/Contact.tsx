import styles from './Contact.module.css'
import Link from 'next/link'

export default function Contact() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Ready to Begin?</p>
        <h2 className={styles.heading}>Your Story Deserves to Be Captured</h2>
        <p className={styles.body}>
          Reserve your date with a deposit, or send a message to start planning
          your session together.
        </p>
        <div className={styles.actions}>
          <Link href="/book" className={styles.btn}>Book a Session</Link>
          <Link href="/contact" className={styles.btnSecondary}>Send an Inquiry</Link>
        </div>
      </div>
    </section>
  )
}
