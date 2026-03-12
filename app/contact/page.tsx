import type { Metadata } from 'next'
import ContactForm from './ContactForm'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Contact | Tynnell Hollins Photography',
  description: 'Book a session with Tynnell Hollins Photography. Weddings, engagements, portraits, and more.',
}

export default function ContactPage() {
  return (
    <main className={styles.main}>
      <div className={styles.grid}>

        {/* Left — editorial */}
        <div className={styles.editorial}>
          <p className={styles.eyebrow}>Let&apos;s Connect</p>
          <h1 className={styles.heading}>Let&apos;s Create<br />Something<br />Beautiful</h1>
          <p className={styles.body}>
            Every love story, milestone, and moment deserves to be told with intention.
            Fill out the form and I&apos;ll be in touch within 48 hours.
          </p>
          <div className={styles.directContact}>
            <a href="mailto:hello@tynnellhollinsphotography.com" className={styles.contactLink}>
              hello@tynnellhollinsphotography.com
            </a>
            <span className={styles.contactDivider}>·</span>
            <a href="https://instagram.com/tynnellhollinsphotography" className={styles.contactLink} target="_blank" rel="noreferrer">
              @tynnellhollinsphotography
            </a>
          </div>
        </div>

        {/* Right — form */}
        <div className={styles.formColumn}>
          <ContactForm />
        </div>

      </div>
    </main>
  )
}
