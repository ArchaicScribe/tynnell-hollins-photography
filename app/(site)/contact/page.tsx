import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import ContactForm from './ContactForm'
import styles from './page.module.css'
import { CONTACT_EMAIL } from '@/app/lib/constants'

export const metadata: Metadata = {
  title: 'Contact | Tynnell Hollins Photography',
  description: 'Book a session with Tynnell Hollins Photography. Weddings, engagements, portraits, and more.',
}

interface BlockedRange {
  startDate?: string | null
  endDate?: string | null
  applyReturnBuffer?: boolean | null
  returnBufferDays?: number | null
  customerMessage?: string | null
}

function getReturnDate(range: BlockedRange): Date {
  const end = new Date(range.endDate!)
  if (range.applyReturnBuffer !== false && (range.returnBufferDays ?? 2) > 0) {
    end.setDate(end.getDate() + (range.returnBufferDays ?? 2))
  }
  end.setHours(23, 59, 59, 999)
  return end
}

function findActiveOrUpcomingRange(ranges: BlockedRange[]): { range: BlockedRange; returnDate: Date } | null {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const sevenDaysOut = new Date(now)
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7)

  for (const range of ranges) {
    if (!range.startDate || !range.endDate) continue
    const start = new Date(range.startDate)
    start.setHours(0, 0, 0, 0)
    const returnDate = getReturnDate(range)

    // Active: today is within the blocked window
    if (now >= start && now <= returnDate) {
      return { range, returnDate }
    }

    // Upcoming: starts within the next 7 days
    if (start > now && start <= sevenDaysOut) {
      return { range, returnDate }
    }
  }
  return null
}

export default async function ContactPage() {
  let ooo: { range: BlockedRange; returnDate: Date } | null = null

  try {
    const payload = await getPayload({ config })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const availability = await payload.findGlobal({ slug: 'availability' as any }) as any
    if (Array.isArray(availability?.blockedRanges)) {
      ooo = findActiveOrUpcomingRange(availability.blockedRanges)
    }
  } catch {
    // Non-fatal: banner simply won't show if globals are unavailable
  }

  const oooMessage = ooo
    ? (ooo.range.customerMessage ?? 'I am currently away and will be back soon.')
        .replace(
          '{returnDate}',
          ooo.returnDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        )
    : null

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
