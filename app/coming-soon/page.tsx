import type { Metadata } from 'next'
import styles from './page.module.css'
import { CONTACT_EMAIL } from '@/app/lib/constants'

export const metadata: Metadata = {
  title: 'Coming Soon | Tynnell Hollins Photography',
  description: 'Tynnell Hollins Photography, Albuquerque wedding and portrait photographer. Launching soon.',
  robots: { index: false, follow: false },
}

export default function ComingSoonPage() {
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <p className={styles.tagline}>Lost in the Moment, Found in Forever</p>
        <h1 className={styles.name}>Tynnell Hollins Photography</h1>
        <p className={styles.message}>Something beautiful is coming.</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className={styles.email}>
          {CONTACT_EMAIL}
        </a>
      </div>
    </main>
  )
}
