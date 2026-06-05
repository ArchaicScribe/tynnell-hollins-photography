import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import ContactForm from './ContactForm'
import styles from './page.module.css'
import { CONTACT_EMAIL } from '@/app/lib/constants'
import { getActiveOoo, type BlockedRange } from '@/app/lib/availability'

export const metadata: Metadata = {
  title: 'Contact | Tynnell Hollins Photography',
  description: 'Book a session with Tynnell Hollins Photography. Weddings, engagements, portraits, and more.',
}

function findActiveOrUpcoming(ranges: BlockedRange[]): string | null {
  // Check active OOO first
  const active = getActiveOoo(ranges)
  if (active) return active.message

  // Also surface an upcoming range starting within 7 days
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const sevenDaysOut = new Date(now)
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7)

  for (const range of ranges) {
    if (!range.startDate || !range.endDate) continue
    const start = new Date(range.startDate)
    start.setHours(0, 0, 0, 0)
    if (start > now && start <= sevenDaysOut) {
      const returnDate = new Date(range.endDate)
      const bufferDays = range.applyReturnBuffer !== false ? (range.returnBufferDays ?? 2) : 0
      if (bufferDays > 0) returnDate.setDate(returnDate.getDate() + bufferDays)
      const returnDateStr = returnDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      return (range.customerMessage ?? `I will be away soon and back on ${returnDateStr}.`)
        .replace('{returnDate}', returnDateStr)
    }
  }
  return null
}

export default async function ContactPage() {
  let oooMessage: string | null = null

  try {
    const payload = await getPayload({ config })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const availability = await payload.findGlobal({ slug: 'availability' as any }) as any
    if (Array.isArray(availability?.blockedRanges)) {
      oooMessage = findActiveOrUpcoming(availability.blockedRanges)
    }
  } catch {
    // Non-fatal: banner simply won't show if globals are unavailable
  }

  return (
    <main className={styles.main}>
      {oooMessage && (
        <div className={styles.oooBanner}>
          <p className={styles.oooMessage}>{oooMessage}</p>
        </div>
      )}
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
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles.contactLink}>
              {CONTACT_EMAIL}
            </a>
            <span className={styles.contactDivider}>·</span>
            <a href="https://instagram.com/tynnellhollinsphotography" className={styles.contactLink} target="_blank" rel="noopener noreferrer">
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
