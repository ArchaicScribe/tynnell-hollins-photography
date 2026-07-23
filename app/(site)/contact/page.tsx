import { cache } from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import { Render, resolveAllData } from '@measured/puck/rsc'
import type { Data } from '@measured/puck'
import config from '@payload-config'
import { config as puckConfig } from '@/app/builder/puck.config'
import ContactForm from './ContactForm'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import styles from './page.module.css'
import { CONTACT_EMAIL } from '@/app/lib/constants'
import { getActiveOoo, type BlockedRange } from '@/app/lib/availability'
import { computeBookingDateBounds } from '@/app/lib/validation'
import { isPreviewMode } from '@/app/lib/builderPreview'

// OOO banner is time-sensitive - shorter revalidate so it appears within 1 minute of being set
export const revalidate = 60

// A builder page can be promoted to replace this real route - same pattern
// as About/Portfolio/Services/Testimonials (see collections/Pages.ts,
// app/(site)/about/page.tsx). Unlike those, the OOO banner below is NOT part
// of the promoted Puck content - it's time-sensitive server logic, the wrong
// affordance for a draggable block, so it renders unconditionally above
// <Render> in the promoted branch too, exactly as it does in the hardcoded
// branch.
const getPromotedPage = cache(async () => {
  const payload = await getPayload({ config })
  const preview = await isPreviewMode()
  const { docs } = await payload.find({
    collection: 'pages',
    where: preview
      ? { promotedRoute: { equals: 'contact' } }
      : { and: [{ promotedRoute: { equals: 'contact' } }, { published: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
})

export async function generateMetadata(): Promise<Metadata> {
  const promoted = await getPromotedPage()
  if (promoted) return { title: promoted.title }
  return {
    title: 'Contact',
    description: 'Book a session with Tynnell Hollins Photography. Weddings, engagements, portraits, and more.',
  }
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
  const promoted = await getPromotedPage()

  let oooMessage: string | null = null
  let minDate: string
  let maxDate: string

  try {
    const payload = await getPayload({ config })
    const [availability, bookingSettings] = await Promise.all([
      payload.findGlobal({ slug: 'availability' }),
      payload.findGlobal({ slug: 'booking-settings' }).catch(() => null),
    ])
    if (Array.isArray(availability?.blockedRanges)) {
      oooMessage = findActiveOrUpcoming(availability.blockedRanges)
    }
    const bounds = computeBookingDateBounds({
      minLeadTimeHours: typeof bookingSettings?.minLeadTimeHours === 'number' ? bookingSettings.minLeadTimeHours : undefined,
      maxBookingMonths: typeof bookingSettings?.maxBookingMonths === 'number' ? bookingSettings.maxBookingMonths : undefined,
    })
    minDate = bounds.minDate
    maxDate = bounds.maxDate
  } catch {
    // Non-fatal: fall back to defaults
    const bounds = computeBookingDateBounds()
    minDate = bounds.minDate
    maxDate = bounds.maxDate
  }

  const contactPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Tynnell Hollins Photography',
    description: 'Book a session or send an inquiry. Weddings, engagements, portraits, and more.',
    url: 'https://tynnellhollinsphotography.com/contact',
    mainEntity: {
      '@type': 'LocalBusiness',
      name: 'Tynnell Hollins Photography',
      email: CONTACT_EMAIL,
      url: 'https://tynnellhollinsphotography.com',
    },
  }

  if (promoted) {
    const data = (promoted.content as Data | undefined) ?? { content: [], root: {} }
    return (
      <>
        <JsonLd data={contactPageSchema} />
        {oooMessage && (
          <div className={styles.oooBanner} role="note" aria-label="Availability notice">
            <p className={styles.oooMessage}>{oooMessage}</p>
          </div>
        )}
        <Render config={puckConfig} data={await resolveAllData(data, puckConfig)} />
      </>
    )
  }

  return (
    <main className={styles.main}>
      <JsonLd data={contactPageSchema} />
      {oooMessage && (
        <div className={styles.oooBanner} role="note" aria-label="Availability notice">
          <p className={styles.oooMessage}>{oooMessage}</p>
        </div>
      )}
      <div className={styles.grid}>

        {/* Left - editorial */}
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

        {/* Right - form */}
        <div className={styles.formColumn}>
          <ContactForm minDate={minDate} maxDate={maxDate} />
        </div>

      </div>
    </main>
  )
}
